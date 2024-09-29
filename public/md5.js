class MD5 {
  constructor() {
    this.A = 0x67452301;
    this.B = 0xefcdab89;
    this.C = 0x98badcfe;
    this.D = 0x10325476;
    this.buffer = new Uint8Array();
    this.lengthInBits = 0;
  }

  // Process a chunk of data (use this for streaming large data)
  update(input) {
    this.buffer = this.concatBuffers(this.buffer, input);
    this.lengthInBits += input.length * 8;

    const chunkSize = 64; // 512 bits
    while (this.buffer.length >= chunkSize) {
      const chunk = this.buffer.slice(0, chunkSize);
      this.buffer = this.buffer.slice(chunkSize);
      this.processChunk(chunk);
    }
  }

  // Process all chunks from a generator, updating hash state
  async hashFromGenerator(generator) {
    let i = 0;
    for await (const chunkPromise of generator) {
      i++;
      if (i % 10000 === 0) {
        console.log("processing chunk", i);
      }
      const chunk = await chunkPromise; // Get the next chunk from the generator
      this.update(chunk); // Process the chunk
    }
    return this.finalize(); // Finalize and return the hash after all chunks
  }

  // Finalize the hash calculation once all chunks have been processed
  finalize() {
    const padding = this.createPadding();
    this.update(padding);
    const res = this.wordToHex(this.A) + this.wordToHex(this.B) + this.wordToHex(this.C) + this.wordToHex(this.D);

    // Clear everything for the next hash calculation
    this.buffer = new Uint8Array();
    this.lengthInBits = 0;
    this.A = 0x67452301;
    this.B = 0xefcdab89;
    this.C = 0x98badcfe;
    this.D = 0x10325476;
    return res;
  }

  // Private helper to concatenate buffers
  concatBuffers(buffer1, buffer2) {
    const concatenated = new Uint8Array(buffer1.length + buffer2.length);
    concatenated.set(buffer1);
    concatenated.set(buffer2, buffer1.length);
    return concatenated;
  }

  // Private helper to create padding for the final chunk
  createPadding() {
    const paddingLength = (this.buffer.length < 56 ? 56 : 120) - this.buffer.length;
    const padding = new Uint8Array(paddingLength + 8); // +8 for length in bits
    padding[0] = 0x80; // Append 1 bit, followed by zeros
    const lengthArray = new Uint8Array(new Uint32Array([this.lengthInBits]).buffer);
    padding.set(lengthArray, paddingLength); // Append length in bits
    return padding;
  }

  // Process a single 512-bit (64-byte) chunk
  processChunk(chunk) {
    const x = this.convertToWordArray(chunk);
    let a = this.A,
      b = this.B,
      c = this.C,
      d = this.D;

    const K = [];
    for (let i = 0; i < 64; i++) {
      K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
    }

    const s = [
      // Round 1
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      // Round 2
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      // Round 3
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      // Round 4
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ];

    for (let j = 0; j < 64; j++) {
      let F;
      let g;

      if (j >= 0 && j <= 15) {
        F = (b & c) | (~b & d);
        g = j;
      } else if (j >= 16 && j <= 31) {
        F = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j >= 32 && j <= 47) {
        F = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        F = c ^ (b | ~d);
        g = (7 * j) % 16;
      }

      const tempD = d;
      d = c;
      c = b;

      let sum = this.addUnsigned(a, F);
      sum = this.addUnsigned(sum, x[g]);
      sum = this.addUnsigned(sum, K[j]);

      const rotated = this.rotateLeft(sum, s[j]);
      b = this.addUnsigned(b, rotated);
      a = tempD;
    }

    // Update the state variables after processing the chunk
    this.A = this.addUnsigned(this.A, a);
    this.B = this.addUnsigned(this.B, b);
    this.C = this.addUnsigned(this.C, c);
    this.D = this.addUnsigned(this.D, d);
  }

  // Add two unsigned 32-bit integers, wrapping at 2^32
  addUnsigned(a, b) {
    const lsw = (a & 0xffff) + (b & 0xffff);
    const msw = (a >>> 16) + (b >>> 16) + (lsw >>> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  // Left-rotate a 32-bit number by a certain number of bits
  rotateLeft(x, n) {
    return (x << n) | (x >>> (32 - n));
  }

  // Convert an array of bytes to an array of 32-bit words
  convertToWordArray(byteArray) {
    const messageLength = byteArray.length;
    const numberOfWords_temp1 = messageLength + 8;
    const numberOfWords_temp2 = ((numberOfWords_temp1 - (numberOfWords_temp1 % 64)) / 64) * 16;
    const numberOfWords = numberOfWords_temp2 + 16;
    const wordArray = new Array(numberOfWords - 1);
    let bytePosition = 0;
    let byteCount = 0;

    // Initialize wordArray
    for (let i = 0; i < numberOfWords; i++) {
      wordArray[i] = 0;
    }

    // Convert byteArray to wordArray
    while (byteCount < messageLength) {
      const wordCount = (byteCount - (byteCount % 4)) / 4;
      bytePosition = (byteCount % 4) * 8;
      wordArray[wordCount] |= byteArray[byteCount] << bytePosition;
      byteCount++;
    }

    // Append padding bits
    const wordCount = (byteCount - (byteCount % 4)) / 4;
    bytePosition = (byteCount % 4) * 8;
    wordArray[wordCount] |= 0x80 << bytePosition;

    // Append length in bits
    wordArray[numberOfWords - 2] = messageLength * 8;
    wordArray[numberOfWords - 1] = 0;

    return wordArray;
  }

  // Convert a 32-bit number to a hexadecimal string
  wordToHex(lValue) {
    let wordToHexValue = "";
    for (let i = 0; i <= 3; i++) {
      const byte = (lValue >>> (i * 8)) & 255;
      const hex = byte.toString(16).padStart(2, "0");
      wordToHexValue += hex;
    }
    return wordToHexValue;
  }
}
