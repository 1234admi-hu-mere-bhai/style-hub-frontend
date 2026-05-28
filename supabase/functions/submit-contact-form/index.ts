import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// Public contact-form endpoint. Validates submissions and then forwards to the
// internal `send-transactional-email` function using the service role key.
// This isolates the powerful email sender from the public anon key so it can't
// be used to send arbitrary emails from our verified domain.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  // Input validation — keep payloads bounded and well-formed
  const emailRe = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  if (
    !name || name.length > 120 ||
    !emailRe.test(email) || email.length > 200 ||
    phone.length > 40 ||
    !subject || subject.length > 200 ||
    !message || message.length > 5000
  ) {
    return new Response(JSON.stringify({ error: 'Invalid contact submission' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const submissionId = crypto.randomUUID()
  const submittedAt = new Date().toISOString()

  const notifyPromise = admin.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'contact-support-notification',
      recipientEmail: 'supportmuffigoutapparelhub@gmail.com',
      replyTo: email,
      idempotencyKey: `contact-notify-${submissionId}`,
      templateData: {
        customerName: name,
        customerEmail: email,
        customerPhone: phone || undefined,
        subject,
        message,
        submittedAt,
      },
    },
  })

  const ackPromise = admin.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'contact-support-ack',
      recipientEmail: email,
      idempotencyKey: `contact-ack-${submissionId}`,
      templateData: { customerName: name, subject, message },
    },
  })

  const [notifyRes, ackRes] = await Promise.all([notifyPromise, ackPromise])

  if (notifyRes.error) {
    console.error('Contact notify failed', notifyRes.error)
    return new Response(JSON.stringify({ error: 'Failed to deliver your message' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (ackRes.error) {
    console.warn('Contact ack failed', ackRes.error)
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
