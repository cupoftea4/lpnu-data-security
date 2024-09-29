class MD5 {
  constructor() {
    this.S = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    this.T = this.S.map((s, i) => (Math.floor(Math.pow(2, 32) * Math.abs(Math.sin(i + 1)))) & 0xFFFFFFFF);
    this.DEFAULT_REGISTERS = {
      a: 0x67452301,
      b: 0xefcdab89,
      c: 0x98badcfe,
      d: 0x10325476
    };
    this.CHUNK_SIZE = 64; // Fixed 64 bytes per block for MD5
  }

  async hash(dataGenerator) {
    let registers = { ...this.DEFAULT_REGISTERS };
    let totalLength = 0;
    let buffer = new Uint8Array(0);

    // Process each chunk from the generator
    for await (let chunk of dataGenerator) {
      totalLength += chunk.length;
      buffer = this.concatTypedArrays(buffer, chunk);

      // Process all complete 64-byte blocks in the buffer
      let offset = 0;
      while (buffer.length - offset >= this.CHUNK_SIZE) {
        const block = buffer.slice(offset, offset + this.CHUNK_SIZE);
        registers = await this.md5Cycle(block, registers);
        offset += this.CHUNK_SIZE;
      }

      // Keep any remaining bytes in the buffer
      buffer = buffer.slice(offset);
    }

    // Append padding
    const messageLengthBits = totalLength * 8;
    let padLength = ((buffer.length + 8) % this.CHUNK_SIZE) > 56
      ? (this.CHUNK_SIZE * 2 - buffer.length - 8) % this.CHUNK_SIZE
      : (this.CHUNK_SIZE - buffer.length - 8) % this.CHUNK_SIZE;

    const padding = new Uint8Array(padLength + 8);
    padding[0] = 0x80; // Append '1' bit and seven '0' bits

    // Append the message length in bits as a 64-bit little-endian integer
    const lengthArray = this.longToByteArray(messageLengthBits);
    padding.set(lengthArray, padLength);

    buffer = this.concatTypedArrays(buffer, padding);

    // Process any remaining 64-byte blocks
    for (let offset = 0; offset < buffer.length; offset += this.CHUNK_SIZE) {
      const block = buffer.slice(offset, offset + this.CHUNK_SIZE);
      registers = await this.md5Cycle(block, registers);
    }

    const hex = Object.values(registers).map(n => this.rhex(n)).join('');
    return hex;
  }

  async md5Cycle(chunk, registers) {
    const { a: a0, b: b0, c: c0, d: d0 } = registers;
    let a = a0, b = b0, c = c0, d = d0;

    for (let i = 0; i < 64; i++) {
      let f, g;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const x = this.bytesToInt(chunk, g);
      const temp = d;
      d = c;
      c = b;
      b = this.add32(b, this.leftRotate(this.add32(a, this.add32(f, this.add32(this.T[i], x))), this.S[i]));
      a = temp;
    }

    return {
      a: this.add32(a0, a),
      b: this.add32(b0, b),
      c: this.add32(c0, c),
      d: this.add32(d0, d)
    };
  }

  add32(a, b) {
    return (a + b) >>> 0;
  }

  leftRotate(a, s) {
    return (a << s) | (a >>> (32 - s));
  }

  concatTypedArrays(a, b) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
  }

  rhex(n) {
    const hexChr = '0123456789abcdef';
    let s = '';
    for (let j = 0; j < 4; j++) {
      s += hexChr[(n >> (j * 8 + 4)) & 0x0F] + hexChr[(n >> (j * 8)) & 0x0F];
    }
    return s;
  }

  bytesToInt(bytes, offset) {
    return (
      (bytes[offset * 4]) |
      (bytes[offset * 4 + 1] << 8) |
      (bytes[offset * 4 + 2] << 16) |
      (bytes[offset * 4 + 3] << 24)
    ) >>> 0;
  }

  longToByteArray(lengthBits) {
    const byteArray = new Uint8Array(8);
    const lowBits = lengthBits & 0xFFFFFFFF;
    const highBits = Math.floor(lengthBits / 0x100000000);

    for (let i = 0; i < 4; i++) {
      byteArray[i] = (lowBits >>> (i * 8)) & 0xFF;
      byteArray[i + 4] = (highBits >>> (i * 8)) & 0xFF;
    }
    return byteArray;
  }
}
