importScripts('/md5.js');

const FILE_READER_CHUNK_SIZE = 1024 * 1024; // 1 MB chunks

self.onmessage = async (e) => {
  const { file } = e.data;

  const md5 = new MD5();
  const totalSize = file.size;

  async function* fileToBytesGenerator(file) {
    let i = 0;
    while (i < file.size) {
      const blob = file.slice(i, i + FILE_READER_CHUNK_SIZE);
      const data = await blob.arrayBuffer();
      const chunk = new Uint8Array(data);
      
      i += FILE_READER_CHUNK_SIZE;

      yield chunk;

      const progress = Math.min((i / totalSize) * 100, 100).toFixed(2);
      self.postMessage({ type: "update", progress });
    }
  }

  try {
    const startTime = performance.now();

    const gen = fileToBytesGenerator(file);
    const hash = await md5.hash(gen);

    const endTime = performance.now();
    const timeTaken = (endTime - startTime).toFixed(2);

    self.postMessage({ type: "complete", hash, progress: 100, timeTaken });
  } catch (error) {
    console.error(error);
    self.postMessage({ type: "error", error: 'Error generating MD5 hash.' });
  }
};
