importScripts('/md5.js');

// Adjust the chunk size for file processing (e.g., 1 MB chunks)
const FILE_READER_CHUNK_SIZE = 1024 * 1024; // 1 MB chunks

// worker.js
self.onmessage = async (e) => {
  const { file } = e.data;

  const md5 = new MD5();

  async function* fileToBytesGenerator(file) {
    let i = 0;
    while (i < file.size) {
      const blob = file.slice(i, i + FILE_READER_CHUNK_SIZE);
      const data = await blob.arrayBuffer(); // Fully load the chunk into memory
      const chunk = new Uint8Array(data);

      yield chunk; // Yield the chunk as is

      i += FILE_READER_CHUNK_SIZE;
    }
  }

  try {
    const gen = fileToBytesGenerator(file);
    console.log('Processing file chunks...');
    console.time('hash_' + file.name);
    const hash = await md5.hash(gen); // Process the file chunks with MD5
    console.timeEnd('hash_' + file.name);
    self.postMessage({ hash });
  } catch (error) {
    console.error(error);
    self.postMessage({ error: 'Error generating MD5 hash.' });
  }
};
