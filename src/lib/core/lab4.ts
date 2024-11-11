export default class RSAService {
  private publicKey: CryptoKey | null = null;
  private privateKey: CryptoKey | null = null;

  async generateKeys() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: { name: "SHA-256" },
      },
      true,
      ["encrypt", "decrypt"]
    );

    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;

    return {
      publicKey: await this.exportKey(keyPair.publicKey),
      privateKey: await this.exportKey(keyPair.privateKey, "pkcs8"),
    };
  }

  async encryptFile(file: File) {
    if (!this.publicKey) {
      throw new Error("Public key is missing");
    }

    // Convert file to ArrayBuffer for encryption
    const fileBuffer = await this.readFileAsArrayBuffer(file);

    try {
      // Encrypt the ArrayBuffer
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        this.publicKey,
        fileBuffer
      );
      return encryptedData; // Keep it as ArrayBuffer
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Encryption failed");
    }
  }

  async decryptFile(encryptedData: ArrayBuffer) {
    if (!this.privateKey) {
      throw new Error("Private key is missing");
    }

    try {
      // Decrypt the ArrayBuffer
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        this.privateKey,
        encryptedData
      );
      return decryptedData; // Return as ArrayBuffer
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Decryption failed");
    }
  }

  // Helper to export keys in a base64 format
  private async exportKey(key: CryptoKey, format: "spki" | "pkcs8" = "spki") {
    const exported = await window.crypto.subtle.exportKey(format, key);
    return this.arrayBufferToBase64(exported);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
