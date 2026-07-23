import * as Crypto from 'expo-crypto'

// §13.1 — PINs here are child-proofing, not security: a 4-digit PIN has
// only 10,000 combinations, so no hash function makes it brute-force
// resistant. Salted SHA-256 via expo-crypto works on iOS/Android/web and
// avoids a bcrypt dependency (bcrypt has no React Native support).

export function generatePinSalt(): string {
  return Crypto.randomUUID()
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  )
}

export async function verifyPin(
  pin: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  return (await hashPin(pin, salt)) === hash
}
