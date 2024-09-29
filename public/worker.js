importScripts('/md5.js');

// worker.js
self.onmessage = async (e) => {
  const { file, FILE_READER_CHUNK_SIZE, CHUNK_BYTES } = e.data;

  const md5 = new MD5();
  
  async function* fileToBytesGenerator(file) {
    let i = 0;
    while (i < file.size) {
      const blob = file.slice(i, i + FILE_READER_CHUNK_SIZE);
      const data = await blob.arrayBuffer();
      for (let j = 0; j < blob.size; j += CHUNK_BYTES) {
        const size = Math.min(CHUNK_BYTES, blob.size - j);
        yield new Uint8Array(data, j, size);
      }
      i += FILE_READER_CHUNK_SIZE;
    }
  }

  try {
    const gen = fileToBytesGenerator(file);
    const hash = await md5.hashFromGenerator(gen);
    self.postMessage({ hash });
  } catch (error) {
    console.error(error);
    self.postMessage({ error: 'Error generating MD5 hash.' });
  }
};
