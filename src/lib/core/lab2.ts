export class MD5 {
  // Public method to compute MD5 hash of a string
  public hash(message: string): string {
    // Step 1: Preprocessing - convert message to UTF-8 and pad it
    message = this.utf8Encode(message);
    const x = this.convertToWordArray(message);

    // Step 2: Initialization - Four variables (A, B, C, D) are initialized
    let A = 0x67452301;
    let B = 0xefcdab89;
    let C = 0x98badcfe;
    let D = 0x10325476;

    // Step 3: Define constants K[i], calculated as abs(sin(i + 1)) * 2^32
    const K = [];
    for (let i = 0; i < 64; i++) {
      K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
    }

    // Step 4: Define shift amounts s
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

    // Step 5: Process the message in successive 512-bit chunks (16 words)
    for (let i = 0; i < x.length; i += 16) {
      // Initialize variables for this chunk
      let a = A;
      let b = B;
      let c = C;
      let d = D;

      // Each round consists of 16 operations
      for (let j = 0; j < 64; j++) {
        let F: number = 0;
        let g: number = 0;

        // Determine the function F and message index g for this operation
        if (j >= 0 && j <= 15) {
          // Round 1
          F = (b & c) | (~b & d);
          g = j;
        } else if (j >= 16 && j <= 31) {
          // Round 2
          F = (d & b) | (~d & c);
          g = (5 * j + 1) % 16;
        } else if (j >= 32 && j <= 47) {
          // Round 3
          F = b ^ c ^ d;
          g = (3 * j + 5) % 16;
        } else if (j >= 48 && j <= 63) {
          // Round 4
          F = c ^ (b | ~d);
          g = (7 * j) % 16;
        }

        // Perform the main operation
        const tempD = d;
        d = c;
        c = b;
        let sum = this.addUnsigned(a, F);
        sum = this.addUnsigned(sum, x[i + g]);
        sum = this.addUnsigned(sum, K[j]);
        const rotated = this.rotateLeft(sum, s[j]);
        b = this.addUnsigned(b, rotated);
        a = tempD;
      }

      // Update the hash values
      A = this.addUnsigned(A, a);
      B = this.addUnsigned(B, b);
      C = this.addUnsigned(C, c);
      D = this.addUnsigned(D, d);
    }

    // Step 6: Output the final hash value as a hexadecimal string
    return (this.wordToHex(A) + this.wordToHex(B) + this.wordToHex(C) + this.wordToHex(D)).toLowerCase();
  }

  // Left-rotate a 32-bit number by a certain number of bits
  private rotateLeft(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  // Add two unsigned 32-bit integers, wrapping at 2^32
  private addUnsigned(a: number, b: number): number {
    const lsw = (a & 0xffff) + (b & 0xffff);
    const msw = (a >> 16) + (b >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  // Encode the string as UTF-8
  private utf8Encode(message: string): string {
    message = message.replace(/\r\n/g, "\n");
    let utftext = "";

    for (let n = 0; n < message.length; n++) {
      const c = message.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  }

  // Convert a string to an array of 32-bit words
  private convertToWordArray(message: string): number[] {
    const messageLength = message.length;
    const numberOfWords_temp1 = messageLength + 8;
    const numberOfWords_temp2 = (numberOfWords_temp1 - (numberOfWords_temp1 % 64)) / 64;
    const numberOfWords = (numberOfWords_temp2 + 1) * 16;
    const wordArray: number[] = Array(numberOfWords - 1);
    let bytePosition = 0;
    let byteCount = 0;

    while (byteCount < messageLength) {
      const wordCount = (byteCount - (byteCount % 4)) / 4;
      bytePosition = (byteCount % 4) * 8;
      wordArray[wordCount] = wordArray[wordCount] | (message.charCodeAt(byteCount) << bytePosition);
      byteCount++;
    }

    // Append padding bits and length
    const wordCount = (byteCount - (byteCount % 4)) / 4;
    bytePosition = (byteCount % 4) * 8;
    wordArray[wordCount] = wordArray[wordCount] | (0x80 << bytePosition);
    wordArray[numberOfWords - 2] = messageLength << 3;
    wordArray[numberOfWords - 1] = messageLength >>> 29;

    return wordArray;
  }

  // Convert a 32-bit number to a hexadecimal string
  private wordToHex(lValue: number): string {
    let wordToHexValue = "";
    const hexString = "0123456789abcdef";
    for (let count = 0; count <= 3; count++) {
      const byte = (lValue >> (count * 8)) & 255;
      wordToHexValue += hexString.charAt((byte >> 4) & 0x0f) + hexString.charAt(byte & 0x0f);
    }
    return wordToHexValue;
  }
}
