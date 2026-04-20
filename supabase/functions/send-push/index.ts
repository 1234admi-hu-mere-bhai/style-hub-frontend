import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Create VAPID JWT
async function createVapidJwt(privateKeyJwk: JsonWebKey, audience: string, subject: string) {
  const key = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const headerB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigArray = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;

  if (sigArray.length === 64) {
    r = sigArray.slice(0, 32);
    s = sigArray.slice(32);
  } else {
    // DER encoded
    const rLen = sigArray[3];
    const rStart = 4;
    const rBytes = sigArray.slice(rStart, rStart + rLen);
    const sLenPos = rStart + rLen + 1;
    const sLen = sigArray[sLenPos];
    const sStart = sLenPos + 1;
    const sBytes = sigArray.slice(sStart, sStart + sLen);

    r = new Uint8Array(32);
    s = new Uint8Array(32);
    r.set(rBytes.length > 32 ? rBytes.slice(rBytes.length - 32) : rBytes, 32 - Math.min(rBytes.length, 32));
    s.set(sBytes.length > 32 ? sBytes.slice(sBytes.length - 32) : sBytes, 32 - Math.min(sBytes.length, 32));
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${unsignedToken}.${uint8ArrayToBase64Url(rawSig)}`;
}

// Encrypt push payload using Web Push encryption (aes128gcm)
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
) {
  // Import subscriber's public key
  const subscriberPubBytes = base64UrlToUint8Array(p256dhKey);
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    subscriberPubBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Generate ephemeral key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // ECDH shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberKey },
    localKeyPair.privateKey,
    256
  );

  const authBytes = base64UrlToUint8Array(authSecret);
  const localPubBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // HKDF to derive IKM
  const ikm = await hkdf(
    new Uint8Array(sharedSecret),
    authBytes,
    concatBuffers(
      new TextEncoder().encode("WebPush: info\0"),
      subscriberPubBytes,
      localPubBytes
    ),
    32
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive content encryption key and nonce
  const prk = await hkdf(ikm, salt, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(ikm, salt, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

  // Encrypt
  const paddedPayload = concatBuffers(new Uint8Array([2]), new TextEncoder().encode(payload));
  const key = await crypto.subtle.importKey("raw", prk, "AES-GCM", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    paddedPayload
  );

  // Build aes128gcm body: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const idLen = new Uint8Array([65]);

  return concatBuffers(salt, rs, idLen, localPubBytes, new Uint8Array(encrypted));
}

async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  // HKDF-Extract: PRK = HMAC-Hash(salt, IKM)
  const saltKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", saltKey, ikm));

  // HKDF-Expand: OKM = HMAC-Hash(PRK, info || 0x01)
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const infoWithCounter = concatBuffers(info, new Uint8Array([1]));
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, infoWithCounter));

  return result.slice(0, length);
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    result.set(buf, offset);
    offset += buf.length;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { title, message, url, tag, userId } = await req.json();

    // Get VAPID keys
    const { data: config } = await adminClient
      .from("push_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({ error: "Push not configured. No VAPID keys found." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const privateKeyJwk = JSON.parse(config.private_key);

    // Get subscriptions (scoped to user if userId provided)
    let subQuery = adminClient.from("push_subscriptions").select("*");
    if (userId) {
      subQuery = subQuery.eq("user_id", userId);
    }
    const { data: subscriptions } = await subQuery;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, message, url: url || "/notifications", tag: tag || "notification" });

    let sent = 0;
    let failed = 0;

    console.log(`Sending push to ${subscriptions.length} subscriber(s)`);

    for (const sub of subscriptions) {
      try {
        const endpointUrl = new URL(sub.endpoint);
        const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

        console.log(`Sending to endpoint: ${sub.endpoint.substring(0, 80)}...`);

        const jwt = await createVapidJwt(privateKeyJwk, audience, config.subject);
        const encryptedBody = await encryptPayload(payload, sub.p256dh, sub.auth);

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            Authorization: `vapid t=${jwt}, k=${config.public_key}`,
            TTL: "86400",
            Urgency: "high",
          },
          body: encryptedBody,
        });

        const responseText = await response.text();
        console.log(`Push response for ${sub.id}: status=${response.status}, body=${responseText}`);

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired, remove it
          await adminClient
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
          failed++;
        } else {
          console.error(`Push failed for ${sub.id}: ${response.status} ${responseText}`);
          failed++;
        }
      } catch (err) {
        console.error(`Push error for ${sub.id}:`, err);
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, total: subscriptions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
