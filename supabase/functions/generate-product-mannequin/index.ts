import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com']

const UPPER_BODY = ['shirt', 'tshirt', 't-shirt', 'jacket', 'hoodie', 'sweater', 'sweatshirt', 'blazer', 'coat', 'kurta', 'polo']
const LOWER_BODY = ['pant', 'pants', 'trouser', 'trousers', 'jeans', 'shorts', 'track', 'trackpant', 'track-pant', 'joggers', 'pyjama', 'pajama']

function getBodyRegion(subcategory: string): 'upper' | 'lower' | 'full' {
  const s = (subcategory || '').toLowerCase()
  if (UPPER_BODY.some(k => s.includes(k))) return 'upper'
  if (LOWER_BODY.some(k => s.includes(k))) return 'lower'
  return 'full'
}

function buildPrompt(region: 'upper' | 'lower' | 'full', subject: 'mannequin' | 'human', angleLabel?: string) {
  const angle = angleLabel ? ` Camera angle: ${angleLabel}.` : ''
  const model = subject === 'human'
    ? 'a realistic Indian male human model in his mid-20s with short dark hair, friendly neutral expression'
    : 'a realistic neutral male mannequin (faceless)'
  if (region === 'upper') {
    return `Dress the garment from this product photo onto ${model}, showing ONLY the upper body from the waist up. No legs visible. Clean light grey studio background, soft even lighting, photorealistic e-commerce style. Preserve exact color, pattern, fabric texture, collar, buttons, and stitching of the original garment.${angle}`
  }
  if (region === 'lower') {
    return `Dress the garment from this product photo onto ${model}, showing ONLY the lower body from the waist down to the feet. No torso or head visible. Clean light grey studio background, soft even lighting, photorealistic e-commerce style. Preserve exact color, pattern, fabric texture, pockets, and stitching of the original garment.${angle}`
  }
  return `Dress the garment from this product photo onto ${model}, full body. Clean light grey studio background, soft even lighting, photorealistic e-commerce style. Preserve exact garment details.${angle}`
}

async function callImageGen(apiKey: string, prompt: string, imageUrl: string): Promise<string> {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      }],
      modalities: ['image', 'text'],
    }),
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`AI gateway ${resp.status}: ${t}`)
  }
  const data = await resp.json()
  const images = data.choices?.[0]?.message?.images
  const b64 = images?.[0]?.image_url?.url
  if (!b64) throw new Error('No image returned')
  return b64 // data URL
}

async function uploadDataUrl(adminClient: any, dataUrl: string, path: string): Promise<string> {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!match) throw new Error('Invalid data URL')
  const mime = match[1]
  const bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0))
  const { error } = await adminClient.storage.from('product-images').upload(path, bytes, {
    contentType: mime, upsert: true,
  })
  if (error) throw error
  const { data } = adminClient.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!

    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const anonClient = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const email = (user.email ?? '').toLowerCase()

    const adminClient = createClient(supabaseUrl, supabaseService)
    let allowed = OWNER_EMAILS.includes(email)
    if (!allowed) {
      const { data: staff } = await adminClient.from('staff_members').select('status, permissions').eq('user_id', user.id).maybeSingle()
      allowed = !!staff && staff.status === 'active' && !!(staff.permissions?.products)
    }
    if (!allowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { action, productImage, subcategory, mannequinImage, baseImage: baseImg, productId, frameCount = 12, subject = 'mannequin' } = await req.json()

    if (!productImage && (action === 'mannequin' || action === 'human')) {
      return new Response(JSON.stringify({ error: 'productImage required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const region = getBodyRegion(subcategory || '')
    const idSlug = (productId || crypto.randomUUID()).toString()

    if (action === 'mannequin' || action === 'human') {
      const subj: 'mannequin' | 'human' = action === 'human' ? 'human' : 'mannequin'
      const dataUrl = await callImageGen(lovableKey, buildPrompt(region, subj), productImage)
      const folder = subj === 'human' ? 'humans' : 'mannequins'
      const url = await uploadDataUrl(adminClient, dataUrl, `${folder}/${idSlug}/front-${Date.now()}.png`)
      return new Response(JSON.stringify({ url, region }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'rotation') {
      const base = baseImg || mannequinImage || productImage
      if (!base) return new Response(JSON.stringify({ error: 'baseImage or productImage required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      const subj: 'mannequin' | 'human' = subject === 'human' ? 'human' : 'mannequin'

      const count = Math.min(Math.max(parseInt(frameCount) || 12, 6), 16)
      const frames: string[] = []
      const angleLabels = [
        'front view (0°)', 'front-right 30°', 'right side 60°', 'right back 90°',
        'right back 120°', 'back 150°', 'back 180°', 'left back 210°',
        'left back 240°', 'left side 270°', 'left front 300°', 'left front 330°',
        'front-left 345°', 'three-quarter front', 'three-quarter back', 'profile',
      ].slice(0, count)

      for (let i = 0; i < count; i++) {
        const prompt = buildPrompt(region, subj, angleLabels[i]) + ' Keep the subject pose, lighting, and background IDENTICAL to the reference — only change the camera angle around the subject.'
        try {
          const dataUrl = await callImageGen(lovableKey, prompt, base)
          const url = await uploadDataUrl(adminClient, dataUrl, `rotations/${idSlug}/${subj}-${i}-${Date.now()}.png`)
          frames.push(url)
        } catch (e) {
          console.error(`Frame ${i} failed:`, e)
        }
      }

      if (frames.length === 0) throw new Error('All frames failed to generate')
      return new Response(JSON.stringify({ frames, region }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('generate-product-mannequin error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
