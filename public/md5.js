
const CHUNK_BYTES = 64; // 64 KB sub-chunks within each chunk
const TAIL_RESERVED_BYTES = 8;
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
  }

  async hash(dataGenerator) {
    let registers = { ...this.DEFAULT_REGISTERS };
    let totalLength = 0;
    let genChunk = await dataGenerator.next();
    let lastChunk = await genChunk.value;
    totalLength += lastChunk.length;

    while (!genChunk.done) {
      const currentChunk = lastChunk;
      genChunk = await dataGenerator.next();
      const nextChunk = await genChunk.value;
      if (!nextChunk) break;
      totalLength += nextChunk.length;

      // Process current chunk in 64-byte blocks
      for (let i = 0; i < currentChunk.length; i += 64) {
        const block = currentChunk.slice(i, i + 64);
        registers = await this.md5Cycle(block, registers);
      }

      lastChunk = nextChunk;
    }

    // Handle the final chunk
    if (lastChunk.length === CHUNK_BYTES) {
      for (let i = 0; i < lastChunk.length; i += 64) {
        const block = lastChunk.slice(i, i + 64);
        registers = await this.md5Cycle(block, registers);
      }
      lastChunk = new Uint8Array([0x80, ...new Array(CHUNK_BYTES - TAIL_RESERVED_BYTES - 1).fill(0), ...this.longToByteArray(totalLength * 8)]);
    }

    if (lastChunk.length < CHUNK_BYTES) {
      const missingBytes = CHUNK_BYTES - lastChunk.length - TAIL_RESERVED_BYTES;
      if (missingBytes <= 0) {
        lastChunk = new Uint8Array([...lastChunk, 0x80, ...new Array(CHUNK_BYTES - lastChunk.length - 1).fill(0)]);
        for (let i = 0; i < lastChunk.length; i += 64) {
          const block = lastChunk.slice(i, i + 64);
          registers = await this.md5Cycle(block, registers);
        }
        lastChunk = new Uint8Array([...new Array(CHUNK_BYTES - TAIL_RESERVED_BYTES).fill(0), ...this.longToByteArray(totalLength * 8)]);
      } else {
        const padding = [0x80, ...new Array(missingBytes - 1).fill(0), ...this.longToByteArray(totalLength * 8)];
        lastChunk = this.concatTypedArrays(lastChunk, new Uint8Array(padding));
      }
    }

    for (let i = 0; i < lastChunk.length; i += 64) {
      const block = lastChunk.slice(i, i + 64);
      registers = await this.md5Cycle(block, registers);
    }

    const hex = Object.values(registers).map(this.rhex).join('');
    return hex;
  }

  async md5Cycle(chunk, registers) {
    const { a: a0, b: b0, c: c0, d: d0 } = registers;
    let f, g;
    let a = a0, b = b0, c = c0, d = d0;

    for (let i = 0; i < CHUNK_BYTES; ++i) {
      if (i < CHUNK_BYTES / 4) {
        f = (b & c) | ((~b) & d);
        g = i;
      } else if (i < CHUNK_BYTES / 4 * 2) {
        f = (b & d) | (c & (~d));
        g = (5 * i + 1) % 16;
      } else if (i < CHUNK_BYTES / 4 * 3) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | (~d));
        g = (7 * i) % 16;
      }

      const data = this.bytesToInt(chunk, g);
      f = this.add32(f, this.add32(a, this.add32(this.T[i], data)));
      a = d;
      d = c;
      c = b;
      b = this.add32(b, this.leftRotate(f, this.S[i]));
    }

    return {
      a: this.add32(a0, a),
      b: this.add32(b0, b),
      c: this.add32(c0, c),
      d: this.add32(d0, d)
    };
  }

  add32(a, b) {
    return (a + b) & 0xFFFFFFFF;
  }

  leftRotate(a, s) {
    return (a << s) | (a >>> (32 - s));
  }

  concatTypedArrays(a, b) {
    const c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
  }

  rhex(n) {
    const hexChr = '0123456789abcdef'.split('');
    let s = '', j = 0;
    for (; j < 4; j++) {
      s += hexChr[(n >> (j * 8 + 4)) & 0x0F] + hexChr[(n >> (j * 8)) & 0x0F];
    }
    return s;
  }

  bytesToInt(bytes, shift) {
    let int = 0;
    for (let i = 0; i < 4; ++i) {
      int |= bytes[shift * 4 + i] << (i * 8);
    }
    return int;
  }

  longToByteArray(long) {
    const byteArray = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < byteArray.length; i++) {
      const byte = long & 0xff;
      byteArray[i] = byte;
      long = (long - byte) / 256;
    }
    return byteArray;
  }
}
