class DSS {
  async generateKeyPair() {
    return await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );
  }

  async signData(privateKey: CryptoKey, data: ArrayBuffer) {
    return await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      privateKey,
      data
    );
  }

  async verifySignature(
    publicKey: CryptoKey,
    signature: ArrayBuffer,
    data: ArrayBuffer
  ) {
    return await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signature,
      data
    );
  }

  toHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  fromHex(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
  }
}

export default DSS;
