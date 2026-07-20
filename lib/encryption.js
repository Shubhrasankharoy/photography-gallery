import crypto from "crypto";

// Derive a secure 32-byte key from process.env.ENCRYPTION_KEY or process.env.GOOGLE_CLIENT_SECRET
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY).digest()
  : crypto.createHash("sha256").update(process.env.GOOGLE_CLIENT_SECRET || "fallback_default_encryption_secret_key_capture_space").digest();

const IV_LENGTH = 16;

export function encryptToken(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptToken(text) {
  if (!text) return "";
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt token:", err);
    return "";
  }
}
