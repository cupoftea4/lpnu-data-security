importScripts('/md5.js');

// worker.js
self.onmessage = async (e) => {
  const { file, FILE_READER_CHUNK_SIZE, CHUNK_BYTES } = e.data;

  const md5 = new MD5();
  
  async function* fileToBytesGenerator(file) {
    let i = 0;
    while (i < file.size) {
      const blob = file.slice(i, i + FILE_READER_CHUNK_SIZE);
      const data = await blob.arrayBuffer(); // Fully load the chunk
      const chunk = new Uint8Array(data);
  
      // Yield the chunk in smaller parts if needed
      for (let j = 0; j < chunk.length; j += CHUNK_BYTES) {
        yield chunk.slice(j, Math.min(j + CHUNK_BYTES, chunk.length));
      }
      i += FILE_READER_CHUNK_SIZE;
    }
  }

  try {
    const gen = fileToBytesGenerator(file);
    const hash = await md5.hash(gen);
    self.postMessage({ hash });
  } catch (error) {
    console.error(error);
    self.postMessage({ error: 'Error generating MD5 hash.' });
  }
};
