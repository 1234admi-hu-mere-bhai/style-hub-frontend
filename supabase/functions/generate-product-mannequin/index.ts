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
    return `Dress the garment from this product photo onto ${model}. Show a complete upper-body e-commerce pose from head/neck to mid-thigh with the whole garment fully visible and never cropped. Clean light grey studio background, soft even lighting, photorealistic e-commerce style. Preserve exact color, pattern, fabric texture, collar, buttons, and stitching of the original garment.${angle}`
  }
  if (region === 'lower') {
    return `Dress the garment from this product photo onto ${model}, showing ONLY the lower body from the waist down to the feet. No torso or head visible. Clean light grey studio background, soft even lighting, photorealistic e-commerce style. Preserve exact color, pattern, fabric texture, pockets, and stitching of the original garment.${angle}`
  }
  return `Dress the garment from this product photo onto ${model}, full body with generous margins so head, shoulders, sleeves, hem, legs and feet are fully visible. Clean light grey studio background, soft even lighting, photorealistic e-commerce style. Preserve exact garment details.${angle}`
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function imageSourceToGeminiPart(source: string): Promise<any> {
  if (source.startsWith('data:')) {
    const match = source.match(/^data:(.+?);base64,(.+)$/)
    if (!match) throw new Error('Invalid product image data')
    return { inline_data: { mime_type: match[1], data: match[2].replace(/\s/g, '') } }
  }
  const response = await fetch(source)
  if (!response.ok) throw new Error(`Could not read product image: ${response.status}`)
  const mime = response.headers.get('content-type')?.split(';')[0] || 'image/png'
  const bytes = new Uint8Array(await response.arrayBuffer())
  return { inline_data: { mime_type: mime, data: bytesToBase64(bytes) } }
}

async function callGeminiDirect(apiKey: string, prompt: string, imageUrl: string): Promise<string> {
  const models = ['gemini-2.5-flash-image-preview', 'gemini-2.5-flash-image']
  const parts = [{ text: prompt }, await imageSourceToGeminiPart(imageUrl)]
  let lastError = ''
  for (const model of models) {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    })
    if (!resp.ok) {
      lastError = `${resp.status}: ${await resp.text().catch(() => '')}`
      if (resp.status !== 404 && resp.status !== 400) break
      continue
    }
    const data = await resp.json()
    const imagePart = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData?.data || part.inline_data?.data)
    const inline = imagePart?.inlineData || imagePart?.inline_data
    if (inline?.data) return `data:${inline.mimeType || inline.mime_type || 'image/png'};base64,${inline.data}`
    lastError = 'No image returned from Gemini'
  }
  throw new Error(lastError || 'Gemini image generation failed')
}

async function generateImage(lovableKey: string, prompt: string, imageUrl: string, geminiKey?: string): Promise<string> {
  if (geminiKey) return await callGeminiDirect(geminiKey, prompt, imageUrl)
  return await callImageGen(lovableKey, prompt, imageUrl)
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
    const geminiKey = Deno.env.get('GEMINI_API_KEY') || undefined

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
      const dataUrl = await generateImage(lovableKey, buildPrompt(region, subj), productImage, geminiKey)
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
          const dataUrl = await generateImage(lovableKey, prompt, base, geminiKey)
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
