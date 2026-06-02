import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const OWNER_EMAILS = ['otw2003@gmail.com', 'kaliasgar776@gmail.com', 'muffigout@gmail.com']
const MONOGRAM_PATH = 'assets/chest-monogram.png'

type ViewKind = 'front' | 'back' | 'spec' | 'highlights' | 'model' | 'model-back' | 'lifestyle'
type Pose =
  | 'sitting' | 'leaning' | 'walking' | 'coffee'
  | 'standing-hands-pockets' | 'arms-crossed' | 'hand-in-hair' | 'looking-away'
  | 'jacket-over-shoulder' | 'on-bike' | 'on-stairs' | 'against-car'
  | 'rooftop' | 'beach-walk' | 'forest-path' | 'studio-profile'
  | 'laughing' | 'phone-call' | 'reading-book' | 'sunglasses-pose'
  | 'denim-jacket-layered' | 'window-light' | 'graffiti-wall' | 'train-station'

function buildPrompt(
  view: ViewKind,
  hex?: string,
  hd?: boolean,
  specs?: { chest?: number; length?: number; sleeve?: number; shoulder?: number; size?: string; fabric?: string; fit?: string; pattern?: string; occasion?: string; collar?: string },
  pose: Pose = 'sitting',
) {
  const colorLock = hex
    ? `CRITICAL COLOR LOCK: The shirt body color MUST be EXACTLY hex ${hex}. Do NOT shift hue, saturation, brightness, warmth, or tint by even one step. Sample this exact color and paint every fiber of the shirt with it.`
    : `CRITICAL COLOR LOCK: Sample the EXACT dominant color from the provided fabric image and paint the shirt with that exact color pixel-for-pixel.`
  const patternLock = `CRITICAL PATTERN LOCK: Reproduce the EXACT pattern, weave, print, stripe spacing, check size, motif scale and texture from the provided fabric image. Tile it naturally across the garment following the fabric's true scale. Do NOT invent or substitute a new pattern. If the fabric is solid, keep it perfectly solid with the same micro-texture.`
  const quality = hd
    ? `Ultra high resolution 4K studio photograph, razor-sharp focus, every weave fiber visible, crisp stitching, professional e-commerce hero shot quality.`
    : `High quality studio product photograph, sharp focus, clean stitching.`

  if (view === 'spec') {
    const size = specs?.size || 'M'
    const chest = specs?.chest ?? 42
    const length = specs?.length ?? 29
    const sleeve = specs?.sleeve ?? 25
    const shoulder = specs?.shoulder ?? 18
    const fabric = specs?.fabric || 'Premium cotton blend'
    return `Professional apparel TECH PACK / SPEC SHEET illustration on a clean off-white paper background with faint blueprint grid. Show a men's full-sleeve button-down shirt rendered as a clean front-view technical flat (vector-style line drawing FILLED with the EXACT fabric color and pattern from the provided fabric image — the rendered shirt MUST visually match the fabric swatch's color and pattern). ${colorLock} ${patternLock} ${quality}

On the left chest pocket of the shirt, draw a SMALL tonal embroidered monogram mark (just a subtle stitched logo silhouette in a slightly lighter/darker shade of the same shirt color, no text, no wordmark) — the same monogram that appears on the photographic mockup.

Around the shirt, draw crisp BLACK measurement callout lines with arrowheads and printed labels in a clean sans-serif font, exactly these four measurements and NO others:
- "CHEST: ${chest}\\"" — horizontal line across the chest, pit-to-pit
- "LENGTH: ${length}\\"" — vertical line from shoulder seam to hem on the right side
- "SLEEVE: ${sleeve}\\"" — diagonal line from shoulder to cuff on the left sleeve
- "SHOULDER: ${shoulder}\\"" — short horizontal line across the top yoke

In the bottom-right corner add a small info panel with EXACTLY these lines printed in clean sans-serif (NO brand name, NO wordmark, NO company name):
"SIZE: ${size}"
"FABRIC: ${fabric}"
"FIT: Regular"
${hex ? `"COLOR: ${hex}"` : `"COLOR: see swatch"`}
and a small ${hex ? hex : 'fabric-sampled'} color swatch square next to the COLOR line.

Style: technical, precise, like a fashion designer's tech pack. NO model, NO mannequin, NO photographic background, NO watermark, NO brand wordmark, NO company name. All text must be perfectly legible, correctly spelled, and only the labels listed above — do not invent extra text.`
  }

  if (view === 'highlights') {
    const fit = specs?.fit || 'Regular'
    const pattern = specs?.pattern || 'Solid'
    const fabric = specs?.fabric || 'Cotton Blend'
    const occasion = specs?.occasion || 'Casual'
    const collar = specs?.collar || 'Spread'
    return `Flipkart-style mobile product-gallery Key Highlights image for a men's shirt listing. Use a full-bleed close-up fashion photograph background like Flipkart: a handsome South Asian male model (age 26-30, clean groomed look, athletic build) wearing the men's full-sleeve button-down shirt — framed from chest to head, face on the RIGHT side, collar, placket, chest pocket, and upper shirt area clearly visible. The background should feel like a Flipkart/Myntra product image: clean gray studio, premium catalog lighting, high contrast white typography overlay, no card frame. ${quality} ${colorLock} ${patternLock}

CRITICAL OVERLAY: On the LEFT side of the image (over the muted background area, NOT on the model's face or the shirt), overlay a Flipkart-style WHITE text panel. Use bold rounded sans-serif typography similar to Flipkart app product pages: large title, small light-gray labels, big bold white values, thin semi-transparent divider lines. Add a subtle dark translucent gradient strip behind the left text only, so the text is readable but the photo remains visible. The panel must read EXACTLY these rows from top to bottom:

Title row: "Key Highlights" (large bold white)
Row 1 label: "Fit"  →  Row 1 value: "${fit}"
Row 2 label: "Collar"  →  Row 2 value: "${collar}"
Row 3 label: "Fabric"  →  Row 3 value: "${fabric}"
Row 4 label: "Pattern"  →  Row 4 value: "${pattern}"
Row 5 label: "Occasion"  →  Row 5 value: "${occasion}"

All text must be perfectly legible and correctly spelled — render ONLY the labels and values listed above, no extra text, no watermark, no logo. Leave the inner back-collar band area clean — a brand label will be composited afterwards. Leave the center of the LEFT chest pocket clean — a small monogram will be composited afterwards.`
  }

  const common = `Photorealistic flat-lay studio product photograph of a men's full-sleeve button-down shirt on a pure white seamless background. Soft even lighting, no harsh shadows on background, perfectly centered, NO model, NO mannequin, NO hands, NO props, NO text overlays, NO watermark, NO printed logo on shirt body. ${quality} ${colorLock} ${patternLock}`
  if (view === 'front') {
    return `${common} VIEW: FRONT view. Shirt laid flat and perfectly symmetric, collar at top, full placket with buttons visible down the center, chest pocket on the LEFT chest (viewer's left), both sleeves spread slightly outward, cuffs visible. Leave the inner back collar area (just under the collar band at the back of the neck) clean and unobstructed — a label tag will be composited there afterwards. Leave the CENTER of the LEFT CHEST POCKET clean — a small monogram will be composited there afterwards.`
  }
  if (view === 'back') {
    return `${common} VIEW: BACK view. Shirt laid flat and perfectly symmetric, back yoke visible at the shoulders, no buttons visible, smooth uninterrupted back panel, both sleeves spread slightly outward.`
  }

  // Human model views
  const modelBase = `Photorealistic high-end fashion editorial photograph of a handsome South Asian male model, age 26-30, clean groomed look, athletic regular build, wearing a men's full-sleeve button-down shirt (the hero garment), neutral mid-tone chinos or dark denim, minimal accessories. The shirt MUST be the visual hero — sharp focus on fabric. ${quality} ${colorLock} ${patternLock} The shirt color and pattern MUST exactly match the provided fabric swatch image. Natural skin tones, professional color grading, shallow depth of field, no text overlays, no watermark, no visible brand logo on shirt body.`

  if (view === 'model') {
    return `${modelBase} POSE: model standing straight, FRONT-FACING toward the camera, neutral confident posture, arms relaxed at sides, looking directly at camera, against a clean light-gray seamless studio backdrop. Classic e-commerce model shot. Full upper body visible from mid-thigh up. The full shirt front including collar, placket buttons, and chest pocket must be clearly visible and sharp.`
  }

  if (view === 'model-back') {
    return `${modelBase} POSE: model standing straight, BACK FACING the camera (showing the BACK of the shirt), head turned slightly over the shoulder in profile, arms relaxed at sides, against a clean light-gray seamless studio backdrop. Full upper body visible from mid-thigh up. The full back panel of the shirt — back yoke, sleeves, and back hem — must be clearly visible, sharp, and show the EXACT pattern and color from the fabric swatch.`
  }

  // lifestyle pose
  const poses: Record<Pose, string> = {
    sitting: `POSE: model SITTING on the edge of a rustic wooden table, one leg up with foot resting on the table edge and the other leg hanging down, sleeves rolled neatly to just below the elbow, hands relaxed, looking off-camera with a calm confident expression. Setting: minimalist concrete-and-wood studio loft with soft window light from the side. Editorial relaxed vibe.`,
    leaning: `POSE: model LEANING casually against a raw textured concrete wall, hands in pockets, slight 3/4 turn toward the camera, weight on one leg, looking just past the camera. Setting: outdoor urban side-street at golden hour with warm directional side light and soft rim highlight on the shoulder. Street-style editorial vibe.`,
    walking: `POSE: model captured mid-stride WALKING through a sunlit corridor, shirt slightly billowing from movement, looking downward thoughtfully, motion-frozen sharp focus on the shirt fabric. Setting: long architectural corridor with warm directional sunlight and soft floor reflections. Cinematic magazine vibe.`,
    coffee: `POSE: model SEATED at a small cafe table, one elbow on the table with hand near chin, the other hand resting on a ceramic coffee cup, gentle smile, looking slightly off-camera. Setting: minimalist sunlit cafe with soft window backlight, blurred warm bokeh. Premium lifestyle vibe.`,
    'standing-hands-pockets': `POSE: model standing straight with both hands tucked casually in front trouser pockets, confident relaxed posture, slight smile, looking directly at camera. Setting: clean neutral studio with soft diffused front light. Classic catalog vibe.`,
    'arms-crossed': `POSE: model standing with arms crossed across chest, confident bold stance, chin slightly lifted, direct intense gaze at camera. Setting: dark moody studio with dramatic side light and deep shadow on opposite side. Premium editorial vibe.`,
    'hand-in-hair': `POSE: model with one hand running through hair, head tilted slightly back, eyes closed or looking up, candid relaxed expression. Setting: outdoor at golden hour with warm rim light from behind. Fashion-magazine vibe.`,
    'looking-away': `POSE: model in three-quarter turn away from camera, looking off into the distance over the shoulder with thoughtful expression. Setting: minimalist concrete plaza with soft overcast light. Contemplative editorial vibe.`,
    'jacket-over-shoulder': `POSE: model walking forward with a lightweight blazer or jacket slung casually over one shoulder hooked on one finger, sleeves of the shirt visible, confident stride. Setting: marble-floored upscale lobby with soft warm light. Luxury vibe.`,
    'on-bike': `POSE: model seated on a vintage Royal Enfield style motorcycle, one foot on the ground, hands resting on handlebars, looking off-camera with calm confidence. Setting: cobblestone street at dusk with warm streetlight bokeh. Heritage vibe.`,
    'on-stairs': `POSE: model SEATED on weathered stone outdoor stairs, elbows resting on knees, hands clasped loosely, looking directly at camera with relaxed half-smile. Setting: old European-style courtyard at midday with dappled shade. Travel vibe.`,
    'against-car': `POSE: model leaning hip against the side of a classic vintage car (no visible brand badges), arms loosely crossed, sunglasses optional, confident half-turn toward camera. Setting: empty desert road at golden hour with warm dust haze. Cinematic vibe.`,
    rooftop: `POSE: model standing on a rooftop terrace, hands in pockets, city skyline behind, slight side-on stance, looking toward horizon. Setting: urban rooftop at golden hour with warm sky gradient. Aspirational vibe.`,
    'beach-walk': `POSE: model walking barefoot along a beach at sunset, shirt sleeves rolled to forearm, gentle ocean breeze lifting the fabric slightly, looking down at the sand with calm expression. Setting: empty sandy beach with warm sunset glow and soft wave bokeh. Resort vibe.`,
    'forest-path': `POSE: model walking slowly along a leaf-strewn forest path, hands in pockets, looking off to one side with serene expression. Setting: tall trees with morning sunbeams piercing through canopy. Nature-luxury vibe.`,
    'studio-profile': `POSE: model in clean side profile facing left, arms relaxed at sides, neutral expression, shoulders square. Setting: pure light-gray seamless studio with crisp single key light. Premium catalog vibe.`,
    laughing: `POSE: model laughing genuinely, head tipped slightly back, eyes crinkled, one hand near collar of shirt, candid joyful moment. Setting: bright sunlit courtyard with soft bounce light. Lifestyle vibe.`,
    'phone-call': `POSE: model holding a smartphone to ear with one hand, free hand in pocket, slight smile, mid-conversation, looking off into middle distance. Setting: glass-walled modern office corridor with cool daylight. Professional vibe.`,
    'reading-book': `POSE: model SEATED on a park bench, one leg crossed over the other, holding an open hardcover book in both hands, eyes down on the page with focused calm expression. Setting: leafy park at late afternoon with soft golden side light. Quiet luxury vibe.`,
    'sunglasses-pose': `POSE: model adjusting a pair of dark sunglasses on the bridge of the nose with one hand, head tilted slightly, confident smirk. Setting: bright midday city street with strong sunlight and crisp shadows. Street-style vibe.`,
    'denim-jacket-layered': `POSE: model standing with a denim jacket worn open OVER the shirt (shirt clearly visible underneath through the open jacket front), hands tucked into front jacket pockets, casual stance, looking at camera. Setting: brick-wall alley with warm tungsten ambient. Layered casual vibe.`,
    'window-light': `POSE: model standing in profile beside a large window, soft window light raking across face and shirt, looking out the window thoughtfully. Setting: minimalist loft interior with neutral walls. Editorial portrait vibe.`,
    'graffiti-wall': `POSE: model standing in front of a colorful graffiti-painted wall, hands in pockets, slight lean back against the wall, cool confident expression. Setting: urban street with bright daylight. Streetwear vibe.`,
    'train-station': `POSE: model standing alone on an empty train station platform, small leather duffel bag at feet, hands in pockets, looking down the tracks. Setting: vintage European train station at early morning with warm low light. Travel-cinematic vibe.`,
  }
  return `${modelBase} ${poses[pose]}`
}

async function callImageGen(apiKey: string, prompt: string, fabricUrl: string, model = 'google/gemini-3-pro-image-preview'): Promise<string> {
  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
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

async function callImageGenWithFallback(apiKey: string, prompt: string, fabricUrl: string): Promise<string> {
  try {
    return await callImageGen(apiKey, prompt, fabricUrl, 'google/gemini-3-pro-image-preview')
  } catch (e) {
    console.warn('Pro image model failed, falling back to flash:', (e as Error).message)
    return await callImageGen(apiKey, prompt, fabricUrl, 'google/gemini-2.5-flash-image')
  }
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

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

// Compute a tonal monogram color (lighter on dark fabrics, darker on light fabrics)
function tonalColor(hex: string): { r: number; g: number; b: number } {
  const { r, g, b } = hexToRgb(hex)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const shift = lum > 0.5 ? -45 : 50 // darker on light, lighter on dark
  const clamp = (v: number) => Math.max(0, Math.min(255, v + shift))
  return { r: clamp(r), g: clamp(g), b: clamp(b) }
}

async function compositeCollarTag(shirt: Image, tagBytes: Uint8Array): Promise<Image> {
  const tag = await Image.decode(tagBytes)
  // Smaller tag, sized to fit inside the back-collar band
  const targetW = Math.round(shirt.width * 0.06)
  const ratio = targetW / tag.width
  const targetH = Math.max(1, Math.round(tag.height * ratio))
  const resized = tag.resize(targetW, targetH)
  const x = Math.round((shirt.width - targetW) / 2)
  // Sit just under the collar band so it reads as a sewn-in inner-neck label
  const y = Math.round(shirt.height * 0.16)
  shirt.composite(resized, x, y)
  return shirt
}

// Composite the MG monogram CENTERED ON the chest pocket (viewer's right chest on a flat-lay front view)
async function compositeChestMonogram(shirt: Image, monogramBytes: Uint8Array, shirtHex?: string): Promise<Image> {
  const mono = await Image.decode(monogramBytes)
  // Smaller logo so it reads as a subtle embroidered pocket emblem
  const targetW = Math.round(shirt.width * 0.038)
  const ratio = targetW / mono.width
  const targetH = Math.max(1, Math.round(mono.height * ratio))
  const resized = mono.resize(targetW, targetH)

  if (shirtHex) {
    const tone = tonalColor(shirtHex)
    for (let y = 0; y < resized.height; y++) {
      for (let x = 0; x < resized.width; x++) {
        const px = resized.getPixelAt(x + 1, y + 1)
        const a = px & 0xff
        if (a === 0) continue
        const newA = Math.round(a * 0.85)
        const rgba = ((tone.r & 0xff) << 24) | ((tone.g & 0xff) << 16) | ((tone.b & 0xff) << 8) | (newA & 0xff)
        resized.setPixelAt(x + 1, y + 1, rgba >>> 0)
      }
    }
  }

  // Pocket is on the viewer's RIGHT chest of a front-facing/flat-lay shirt (~62% from left, ~40% from top)
  const x = Math.round(shirt.width * 0.62 - targetW / 2)
  const y = Math.round(shirt.height * 0.40 - targetH / 2)
  shirt.composite(resized, x, y)
  return shirt
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

    const { fabricUrl, view = 'front', colorHex, collarTagUrl, productId, hd = false, specs, pose = 'sitting' } = await req.json()
    if (!fabricUrl) throw new Error('fabricUrl required')
    const validViews = ['front', 'back', 'spec', 'highlights', 'model', 'model-back', 'lifestyle']
    if (!validViews.includes(view)) throw new Error('invalid view')

    const dataUrl = await callImageGenWithFallback(lovableKey, buildPrompt(view, colorHex, hd, specs, pose), fabricUrl)

    const dataUrl = await callImageGen(lovableKey, buildPrompt(view, colorHex, hd, specs, pose), fabricUrl)
    let { bytes, mime } = dataUrlToBytes(dataUrl)

    // FRONT + HIGHLIGHTS views: composite collar tag at back-neck AND tonal MG monogram on chest pocket
    if (view === 'front' || view === 'highlights') {
      try {
        let shirt = await Image.decode(bytes)
        if (collarTagUrl) {
          const tagBytes = await fetchBytes(collarTagUrl)
          shirt = await compositeCollarTag(shirt, tagBytes)
        }
        const monoPublic = adminClient.storage.from('product-images').getPublicUrl(MONOGRAM_PATH).data.publicUrl
        try {
          const monoBytes = await fetchBytes(monoPublic)
          shirt = await compositeChestMonogram(shirt, monoBytes, colorHex)
        } catch (e) {
          console.error('Monogram overlay skipped:', e)
        }
        bytes = await shirt.encode()
        mime = 'image/png'
      } catch (e) {
        console.error('Composite failed, returning bare shirt:', e)
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
