
// Generates a random salt for key derivation
export const generateSalt = () => window.crypto.getRandomValues(new Uint8Array(16));

// Derives a cryptographic key from the PIN and Salt using PBKDF2
export const deriveKey = async (pin: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// Encrypts data object into a string containing salt, iv, and ciphertext
export const encryptData = async (data: any, pin: string): Promise<string> => {
  try {
    const salt = generateSalt();
    const key = await deriveKey(pin, salt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedData
    );

    // Combine Salt + IV + Ciphertext into a single base64 string
    const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
    buffer.set(salt, 0);
    buffer.set(iv, salt.byteLength);
    buffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

    return btoa(String.fromCharCode(...buffer));
  } catch (e) {
    console.error("Encryption failed", e);
    throw new Error("Failed to encrypt data");
  }
};

// Decrypts the base64 string back into data object
export const decryptData = async (encryptedString: string, pin: string): Promise<any> => {
  try {
    const binaryString = atob(encryptedString);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }

    // Extract parts
    const salt = buffer.slice(0, 16);
    const iv = buffer.slice(16, 28);
    const data = buffer.slice(28);

    const key = await deriveKey(pin, salt);

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const decodedString = new TextDecoder().decode(decryptedContent);
    return JSON.parse(decodedString);
  } catch (e) {
    // If decryption fails (wrong PIN), this error is thrown
    throw new Error("Decryption failed. Wrong PIN.");
  }
};
