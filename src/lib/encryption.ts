/**
 * Application-layer encryption for sensitive fields (e.g., github_token).
 *
 * Uses AES-256-GCM via the Node.js crypto module.
 * Ciphertext is returned as a base64-encoded string: iv:ciphertext:authTag
 *
 * Requires ENCRYPTION_KEY environment variable (32-byte hex string).
 * Generate one: openssl rand -hex 32
 *
 * Key rotation: set ENCRYPTION_KEY_PREVIOUS to the previous key while
 * rotating. Encryption always uses ENCRYPTION_KEY; decryption tries the
 * current key first, then falls back to ENCRYPTION_KEY_PREVIOUS so already
 * stored tokens stay readable during the rotation window.
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getEncryptionKey(keyHex?: string): Buffer {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars). " +
      "Generate: openssl rand -hex 32"
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns base64-encoded "iv:ciphertext:authTag".
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const key = getEncryptionKey(process.env.ENCRYPTION_KEY);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}:${encrypted}:${authTag}`;
}

/**
 * Decrypt a string previously encrypted with encrypt().
 * Expects base64-encoded "iv:ciphertext:authTag".
 * Tries the current key first, then ENCRYPTION_KEY_PREVIOUS if set.
 * Throws an Error if neither key can decrypt (e.g. key rotation without
 * keeping the previous key) — callers must handle this gracefully.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const keys = [
    process.env.ENCRYPTION_KEY,
    process.env.ENCRYPTION_KEY_PREVIOUS,
  ].filter(Boolean) as string[];

  for (const keyHex of keys) {
    try {
      const key = getEncryptionKey(keyHex);
      const [ivB64, encB64, authTagB64] = parts;
      const iv = Buffer.from(ivB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encB64, "base64", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      // GCM auth-tag mismatch — wrong key for this value; try next key
    }
  }

  throw new Error("Unable to decrypt value with any configured key");
}
