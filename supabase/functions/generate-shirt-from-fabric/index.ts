import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com']

function buildPrompt(view: 'front' | 'back', hex?: string, hd?: boolean) {
  const colorLock = hex
    ? `CRITICAL COLOR LOCK: The shirt body color MUST be EXACTLY hex ${hex}. Do NOT shift hue, saturation, brightness, warmth, or tint by even one step. Sample this exact color and paint every fiber of the shirt with it. If in doubt, err toward the swatch, never toward a "nicer" color.`
    : `CRITICAL COLOR LOCK: Sample the EXACT dominant color from the provided fabric image and paint the shirt with that exact color pixel-for-pixel as perceived. Do NOT prettify, brighten, desaturate or shift hue.`
  const patternLock = `CRITICAL PATTERN LOCK: Reproduce the EXACT pattern, weave, print, stripe spacing, check size, motif scale and texture from the provided fabric image. Tile it naturally across the garment following the fabric's true scale. Do NOT invent, simplify, stylize, or substitute a new pattern. If the fabric is solid, keep it perfectly solid with the same micro-texture.`
  const quality = hd
    ? `Ultra high resolution 4K studio photograph, razor-sharp focus, every weave fiber visible, crisp stitching, professional e-commerce hero shot quality.`
    : `High quality studio product photograph, sharp focus, clean stitching.`
  const common = `Photorealistic flat-lay studio product photograph of a men's full-sleeve button-down shirt on a pure white seamless background. Soft even lighting, no harsh shadows on background, perfectly centered, NO model, NO mannequin, NO hands, NO props, NO text overlays, NO watermark, NO logo on shirt body. ${quality} ${colorLock} ${patternLock}`
  if (view === 'front') {
    return `${common} VIEW: FRONT view. Shirt laid flat and perfectly symmetric, collar at top, full placket with buttons visible down the center, chest pocket on the left chest, both sleeves spread slightly outward, cuffs visible. Leave the inner back collar area (just under the collar band at the back of the neck) clean and unobstructed — a label tag will be composited there afterwards.`
  }
  return `${common} VIEW: BACK view. Shirt laid flat and perfectly symmetric, back yoke visible at the shoulders, no buttons visible, smooth uninterrupted back panel, both sleeves spread slightly outward.`
}

async function callImageGen(apiKey: string, prompt: string, fabricUrl: string): Promise<string> {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-pro-image-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: fabricUrl } },
        ],
      }],
      modalities: ['image', 'text'],
    }),
  })
  if (!resp.ok) throw new Error(`AI gateway ${resp.status}: ${await resp.text()}`)
  const data = await resp.json()
  const b64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (!b64) throw new Error('No image returned')
  return b64
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const m = dataUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!m) throw new Error('Invalid data URL')
  return { mime: m[1], bytes: Uint8Array.from(atob(m[2]), c => c.charCodeAt(0)) }
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`)
  return new Uint8Array(await r.arrayBuffer())
}

async function compositeCollarTag(shirtBytes: Uint8Array, tagBytes: Uint8Array): Promise<Uint8Array> {
  const shirt = await Image.decode(shirtBytes)
  const tag = await Image.decode(tagBytes)
  // Target tag width ~9% of shirt width, placed centered horizontally,
  // approx 14% from the top (just under the back collar band on a flat-lay front view)
  const targetW = Math.round(shirt.width * 0.09)
  const ratio = targetW / tag.width
  const targetH = Math.max(1, Math.round(tag.height * ratio))
  const resized = tag.resize(targetW, targetH)
  const x = Math.round((shirt.width - targetW) / 2)
  const y = Math.round(shirt.height * 0.13)
  shirt.composite(resized, x, y)
  return await shirt.encode()
}

async function uploadBytes(adminClient: any, bytes: Uint8Array, path: string, mime: string): Promise<string> {
  const { error } = await adminClient.storage.from('product-images').upload(path, bytes, {
    contentType: mime, upsert: true,
  })
  if (error) throw error
  return adminClient.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableKey = Deno.env.get('LOVABLE_API_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')
    const anonClient = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const email = (user.email ?? '').toLowerCase()
    const adminClient = createClient(supabaseUrl, supabaseService)
    let allowed = OWNER_EMAILS.includes(email)
    if (!allowed) {
      const { data: staff } = await adminClient.from('staff_members').select('status, permissions').eq('user_id', user.id).maybeSingle()
      allowed = !!staff && staff.status === 'active' && !!(staff.permissions?.products)
    }
    if (!allowed) throw new Error('Forbidden')

    const { fabricUrl, view = 'front', colorHex, collarTagUrl, productId, hd = false } = await req.json()
    if (!fabricUrl) throw new Error('fabricUrl required')
    if (view !== 'front' && view !== 'back') throw new Error('view must be front|back')

    const dataUrl = await callImageGen(lovableKey, buildPrompt(view, colorHex, hd), fabricUrl)
    let { bytes, mime } = dataUrlToBytes(dataUrl)

    // Overlay collar tag on FRONT view if provided
    if (view === 'front' && collarTagUrl) {
      try {
        const tagBytes = await fetchBytes(collarTagUrl)
        bytes = await compositeCollarTag(bytes, tagBytes)
        mime = 'image/png'
      } catch (e) {
        console.error('Collar tag overlay failed, returning bare shirt:', e)
      }
    }

    const slug = (productId || crypto.randomUUID()).toString()
    const url = await uploadBytes(adminClient, bytes, `fabric-mockups/${slug}/${view}-${Date.now()}.png`, mime)
    return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('generate-shirt-from-fabric:', err)
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500
    return new Response(JSON.stringify({ error: err.message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
