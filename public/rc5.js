// Linear Congruential Generator (LCG) Implementation
class LinearCongruentialGenerator {
  generate({ seed, a, c, m }) {
    return Number((BigInt(a) * BigInt(seed) + BigInt(c)) % BigInt(m));
  }

  generateSequence(input) {
    const { n, ...rest } = input;
    const sequence = new Array(n);

    sequence[0] = this.generate({ ...rest, seed: input.seed });

    for (let i = 1; i < n; i++) {
      sequence[i] = this.generate({ ...rest, seed: sequence[i - 1] });
    }

    return sequence;
  }
}

// RC5 Implementation with RC5-CBC-Pad Mode
class RC5 {
  constructor(key, r = 20, b = 32) {
    this.w = 32; // word size in bits
    this.mod = 0x100000000; // modulus for 32-bit arithmetic
    if (key.length !== b) {
      throw new Error(`Key size must be ${b} bytes.`);
    }
    this.r = r;
    this.b = b;
    this.S = this.keyExpansion(key);
  }

  keyExpansion(key) {
    const u = this.w / 8; // bytes per word
    const c = Math.ceil(key.length / u); // number of words in the key
    const L = new Array(c).fill(0);

    // Convert key into words
    for (let i = key.length - 1; i >= 0; i--) {
      L[Math.floor(i / u)] = ((L[Math.floor(i / u)] << 8) + key[i]) >>> 0;
    }

    const S = new Array(2 * (this.r + 1));
    S[0] = 0xb7e15163; // P32
    for (let i = 1; i < S.length; i++) {
      S[i] = (S[i - 1] + 0x9e3779b9) >>> 0; // Q32
    }

    let i = 0,
      j = 0,
      A = 0,
      B = 0;
    const v = 3 * Math.max(S.length, L.length);

    // Mixing the key into the array
    for (let s = 0; s < v; s++) {
      A = S[i] = this.rotateLeft((S[i] + A + B) >>> 0, 3);
      B = L[j] = this.rotateLeft((L[j] + A + B) >>> 0, (A + B) % this.w);
      i = (i + 1) % S.length;
      j = (j + 1) % L.length;
    }

    return S;
  }

  rotateLeft(x, y) {
    return ((x << y % this.w) | (x >>> (this.w - (y % this.w)))) >>> 0;
  }

  rotateRight(x, y) {
    return ((x >>> y % this.w) | (x << (this.w - (y % this.w)))) >>> 0;
  }

  generateIV() {
    const lcg = new LinearCongruentialGenerator();
    const ivBytes = new Uint8Array(8);

    const lcgParams = {
      seed: Date.now() % 4294967296, // Use current time as seed
      a: 1664525,
      c: 1013904223,
      m: 4294967296,
      n: 2, // We need two 32-bit numbers to get 8 bytes
    };

    const randNumbers = lcg.generateSequence(lcgParams);
    console.log("Generated random numbers:", randNumbers);

    for (let i = 0; i < 2; i++) {
      ivBytes[i * 4 + 0] = (randNumbers[i] >>> 24) & 0xff;
      ivBytes[i * 4 + 1] = (randNumbers[i] >>> 16) & 0xff;
      ivBytes[i * 4 + 2] = (randNumbers[i] >>> 8) & 0xff;
      ivBytes[i * 4 + 3] = randNumbers[i] & 0xff;
    }

    return ivBytes;
  }

  encryptBlock(plaintext) {
    let [A, B] = plaintext;
    A = (A + this.S[0]) >>> 0;
    B = (B + this.S[1]) >>> 0;

    for (let i = 1; i <= this.r; i++) {
      A = (this.rotateLeft((A ^ B) >>> 0, B) + this.S[2 * i]) >>> 0;
      B = (this.rotateLeft((B ^ A) >>> 0, A) + this.S[2 * i + 1]) >>> 0;
    }

    return [A, B];
  }

  decryptBlock(ciphertext) {
    let [A, B] = ciphertext;

    for (let i = this.r; i > 0; i--) {
      B = this.rotateRight((B - this.S[2 * i + 1]) >>> 0, A) ^ A;
      A = this.rotateRight((A - this.S[2 * i]) >>> 0, B) ^ B;
    }

    B = (B - this.S[1]) >>> 0;
    A = (A - this.S[0]) >>> 0;

    return [A, B];
  }

  pad(data) {
    const padLength = 8 - (data.length % 8);
    const padded = new Uint8Array(data.length + padLength);
    padded.set(data);
    padded.fill(padLength, data.length);
    return padded;
  }

  unpad(data) {
    const padLength = data[data.length - 1];
    return data.slice(0, data.length - padLength);
  }

  encryptData(data, onProgress) {
    const padded = this.pad(data);
    const encryptedBlocks = [];

    const iv = this.generateIV();
    console.log("Generated IV:", iv);

    const ivDataView = new DataView(iv.buffer, iv.byteOffset, iv.byteLength);
    const ivBlock = [ivDataView.getUint32(0, false), ivDataView.getUint32(4, false)];
    const encryptedIV = this.encryptBlock(ivBlock);

    const encryptedIVBytes = new Uint8Array(8);
    const encryptedIVDataView = new DataView(encryptedIVBytes.buffer);
    encryptedIVDataView.setUint32(0, encryptedIV[0], false);
    encryptedIVDataView.setUint32(4, encryptedIV[1], false);
    encryptedBlocks.push(encryptedIVBytes);

    let previousCiphertextBlock = encryptedIV;
    const dataView = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
    const totalBlocks = padded.length / 8;
    let lastLoggedProgress = -1;

    for (let offset = 0; offset < padded.length; offset += 8) {
      const plaintextBlock = [
        dataView.getUint32(offset, false),
        dataView.getUint32(offset + 4, false),
      ];

      const xoredBlock = [
        plaintextBlock[0] ^ previousCiphertextBlock[0],
        plaintextBlock[1] ^ previousCiphertextBlock[1],
      ];

      const encryptedBlock = this.encryptBlock(xoredBlock);

      const encryptedBlockBytes = new Uint8Array(8);
      const blockDataView = new DataView(encryptedBlockBytes.buffer);
      blockDataView.setUint32(0, encryptedBlock[0], false);
      blockDataView.setUint32(4, encryptedBlock[1], false);

      encryptedBlocks.push(encryptedBlockBytes);
      previousCiphertextBlock = encryptedBlock;

      // Calculate and log whole number progress
      const progress = Math.floor(((offset / 8 + 1) / totalBlocks) * 100);
      if (progress !== lastLoggedProgress) {
        console.log(`Encryption progress: ${progress}%`);
        onProgress(progress);
        lastLoggedProgress = progress;
      }
    }

    const encryptedDataLength = encryptedBlocks.reduce((sum, arr) => sum + arr.length, 0);
    const encryptedData = new Uint8Array(encryptedDataLength);
    let offset = 0;
    for (const block of encryptedBlocks) {
      encryptedData.set(block, offset);
      offset += block.length;
    }

    return encryptedData;
  }

  decryptData(encrypted, onProgress) {
    const decryptedBlocks = [];

    const encryptedIVDataView = new DataView(encrypted.buffer, encrypted.byteOffset, encrypted.byteLength);
    const encryptedIV = [
      encryptedIVDataView.getUint32(0, false),
      encryptedIVDataView.getUint32(4, false),
    ];

    const iv = this.decryptBlock(encryptedIV);
    console.log("Decrypted IV:", iv);

    let previousCiphertextBlock = encryptedIV;
    const totalBlocks = (encrypted.length - 8) / 8;
    let lastLoggedProgress = -1;

    const encryptedDataView = new DataView(
      encrypted.buffer,
      encrypted.byteOffset + 8,
      encrypted.byteLength - 8
    );

    for (let blockIndex = 0; blockIndex < totalBlocks; blockIndex++) {
      const offset = blockIndex * 8;
      const ciphertextBlock = [
        encryptedDataView.getUint32(offset, false),
        encryptedDataView.getUint32(offset + 4, false),
      ];

      const decryptedBlock = this.decryptBlock(ciphertextBlock);

      const plaintextBlock = [
        decryptedBlock[0] ^ previousCiphertextBlock[0],
        decryptedBlock[1] ^ previousCiphertextBlock[1],
      ];

      const plaintextBlockBytes = new Uint8Array(8);
      const plaintextDataView = new DataView(plaintextBlockBytes.buffer);
      plaintextDataView.setUint32(0, plaintextBlock[0], false);
      plaintextDataView.setUint32(4, plaintextBlock[1], false);

      decryptedBlocks.push(plaintextBlockBytes);
      previousCiphertextBlock = ciphertextBlock;

      // Calculate and log whole number progress
      const progress = Math.floor(((blockIndex + 1) / totalBlocks) * 100);
      if (progress !== lastLoggedProgress) {
        console.log(`Decryption progress: ${progress}%`);
        onProgress(progress);
        lastLoggedProgress = progress;
      }
    }

    const decryptedDataLength = decryptedBlocks.reduce((sum, arr) => sum + arr.length, 0);
    const decryptedData = new Uint8Array(decryptedDataLength);
    let offset = 0;
    for (const block of decryptedBlocks) {
      decryptedData.set(block, offset);
      offset += block.length;
    }

    const unpadded = this.unpad(decryptedData);

    return unpadded;
  }
}
