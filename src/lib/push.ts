import { SignJWT, importJWK } from "jose";
import { getDB, D1Database } from "@/lib/db";

export function bufferToUrlBase64(buf: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < buf.length; i++) {
    bin += String.fromCharCode(buf[i]);
  }
  return btoa(bin)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
  x: string;
  y: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  type?: "event" | "notification";
  tag?: string;
  timestamp?: number;
}

export async function generateVapidKeyPair(subject: string = "mailto:admin@anfitness.in"): Promise<VapidKeys> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const jwkPublic = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const jwkPrivate = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const rawPublic = await crypto.subtle.exportKey("raw", keyPair.publicKey);

  const publicKeyBase64Url = bufferToUrlBase64(new Uint8Array(rawPublic));
  const privateKeyBase64Url = jwkPrivate.d!;

  return {
    publicKey: publicKeyBase64Url,
    privateKey: privateKeyBase64Url,
    subject,
    x: jwkPublic.x!,
    y: jwkPublic.y!,
  };
}

export async function getOrInitVapidKeys(db?: D1Database): Promise<VapidKeys> {
  const database = db || getDB();

  await database
    .exec(`
      CREATE TABLE IF NOT EXISTS vapid_keys (
        id TEXT PRIMARY KEY DEFAULT 'default',
        public_key TEXT NOT NULL,
        private_key TEXT NOT NULL,
        subject TEXT DEFAULT 'mailto:admin@anfitness.in'
      );
    `)
    .catch(() => {});

  try {
    const row: any = await database
      .prepare("SELECT public_key, private_key, subject FROM vapid_keys WHERE id = 'default'")
      .first();

    if (row && row.public_key && row.private_key) {
      const pubBytes = urlBase64ToUint8Array(row.public_key);
      const pubKey = await crypto.subtle.importKey(
        "raw",
        pubBytes as unknown as BufferSource,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );
      const jwk = await crypto.subtle.exportKey("jwk", pubKey);

      return {
        publicKey: row.public_key,
        privateKey: row.private_key,
        subject: row.subject || "mailto:admin@anfitness.in",
        x: jwk.x!,
        y: jwk.y!,
      };
    }
  } catch (e) {
    console.error("VAPID DB lookup error, generating key pair:", e);
  }

  const newKeys = await generateVapidKeyPair("mailto:admin@anfitness.in");
  try {
    await database
      .prepare(
        "INSERT OR REPLACE INTO vapid_keys (id, public_key, private_key, subject) VALUES ('default', ?, ?, ?)"
      )
      .bind(newKeys.publicKey, newKeys.privateKey, newKeys.subject)
      .run();
  } catch (err) {
    console.error("Failed to store VAPID keys in DB:", err);
  }

  return newKeys;
}

async function createVapidHeaders(endpoint: string, vapid: VapidKeys) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const privateJwk = {
    kty: "EC",
    crv: "P-256",
    d: vapid.privateKey,
    x: vapid.x,
    y: vapid.y,
  };

  const key = await importJWK(privateJwk, "ES256");

  const jwt = await new SignJWT({})
    .setAudience(audience)
    .setSubject(vapid.subject)
    .setExpirationTime("12h")
    .sign(key);

  return {
    Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
  };
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as unknown as BufferSource, { name: "HKDF" }, false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt as unknown as BufferSource,
      info: info as unknown as BufferSource,
    },
    key,
    length * 8
  );
  return new Uint8Array(derived);
}

// RFC 8291 aes128gcm Web Push Payload Encryption
async function encryptPayload(
  payloadText: string,
  subKeys: { p256dh: string; auth: string }
): Promise<Uint8Array> {
  const clientPublicKeyBytes = urlBase64ToUint8Array(subKeys.p256dh);
  const clientAuthBytes = urlBase64ToUint8Array(subKeys.auth);

  // 1. Generate local server P-256 ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // 2. Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes as unknown as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // 3. Perform ECDH secret derivation
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  // 4. Generate random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // 5. Derive PRK using HKDF
  // RFC 8291 info = "WebPush: info\0" + clientPublicKeyBytes + serverPublicKeyBytes
  const infoPrefix = new TextEncoder().encode("WebPush: info\0"); // 14 bytes
  const infoWebPush = new Uint8Array(infoPrefix.length + clientPublicKeyBytes.length + localPublicKeyRaw.length);
  infoWebPush.set(infoPrefix, 0);
  infoWebPush.set(clientPublicKeyBytes, infoPrefix.length);
  infoWebPush.set(localPublicKeyRaw, infoPrefix.length + clientPublicKeyBytes.length);

  const prk = await hkdf(clientAuthBytes, ecdhSecret, infoWebPush, 32);

  // 6. Derive CEK and Nonce
  const infoCEK = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const infoNonce = new TextEncoder().encode("Content-Encoding: nonce\0");

  const cek = await hkdf(salt, prk, infoCEK, 16);
  const nonce = await hkdf(salt, prk, infoNonce, 12);

  // 7. Format plaintext with delimiter 0x02
  const payloadBytes = new TextEncoder().encode(payloadText);
  const recordBytes = new Uint8Array(payloadBytes.length + 1);
  recordBytes.set(payloadBytes, 0);
  recordBytes[payloadBytes.length] = 0x02;

  // 8. AES-128-GCM encryption
  const aesKey = await crypto.subtle.importKey("raw", cek as unknown as BufferSource, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce as unknown as BufferSource, tagLength: 128 },
    aesKey,
    recordBytes as unknown as BufferSource
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  // 9. Frame aes128gcm header: salt (16) + record_size 4096 (4) + key_id_len 65 (1) + server_public_key (65)
  const recordSize = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8) & 0xff;
  header[19] = recordSize & 0xff;
  header[20] = 65;
  header.set(localPublicKeyRaw, 21);

  const encryptedRecord = new Uint8Array(header.length + ciphertext.length);
  encryptedRecord.set(header, 0);
  encryptedRecord.set(ciphertext, header.length);

  return encryptedRecord;
}

export async function sendWebPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload,
  vapid: VapidKeys
): Promise<{ success: boolean; statusCode: number; error?: string }> {
  try {
    const vapidHeaders = await createVapidHeaders(subscription.endpoint, vapid);
    const body = await encryptPayload(JSON.stringify(payload), subscription.keys);

    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        ...vapidHeaders,
        "Crypto-Key": `p256ecdsa=${vapid.publicKey}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
        "Urgency": "high",
      },
      body: body as unknown as BodyInit,
    });

    if (res.status === 201 || res.status === 200 || res.status === 202) {
      return { success: true, statusCode: res.status };
    }

    const errText = await res.text().catch(() => "");
    return {
      success: false,
      statusCode: res.status,
      error: `Push service returned ${res.status}: ${errText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      error: err.message || "Failed to send web push",
    };
  }
}

export async function broadcastPushNotification(
  db: D1Database,
  payload: PushPayload
): Promise<{ sent: number; failed: number; total: number; errors?: string[] }> {
  const vapidKeys = await getOrInitVapidKeys(db);

  await db
    .exec(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    .catch(() => {});

  let subscriptions: PushSubscriptionData[] = [];
  try {
    const { results } = await db
      .prepare("SELECT endpoint, p256dh, auth FROM push_subscriptions")
      .all();
    if (results && Array.isArray(results)) {
      subscriptions = results.map((r: any) => ({
        endpoint: r.endpoint,
        keys: {
          p256dh: r.p256dh,
          auth: r.auth,
        },
      }));
    }
  } catch (e) {
    console.error("Failed to query push subscriptions:", e);
    return { sent: 0, failed: 0, total: 0, errors: ["Database query failed"] };
  }

  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];
  const errors: string[] = [];

  for (const sub of subscriptions) {
    const res = await sendWebPushNotification(sub, payload, vapidKeys);
    if (res.success) {
      sent++;
    } else {
      failed++;
      if (res.error) errors.push(res.error);
      if (res.statusCode === 404 || res.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    for (const ep of expiredEndpoints) {
      await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(ep).run().catch(() => {});
    }
  }

  return { sent, failed, total: subscriptions.length, errors: errors.length > 0 ? errors : undefined };
}
