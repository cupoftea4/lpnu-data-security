importScripts('/rc5.js');

self.onmessage = async (e) => {
  const { file, key, action } = e.data;
  const rc5 = new RC5(key);

  try {
    const data = file
    let startTime = performance.now();

    if (action === "encrypt") {
      // Encrypt the file data with progress updates
      const encryptedData = rc5.encryptData(data, (progress) => {
        self.postMessage({ type: "update", process: "encryption", progress });
      });
      self.postMessage({
        type: "complete",
        process: "encryption",
        timeTaken: (performance.now() - startTime).toFixed(2),
        data: encryptedData.buffer,
      });
    } else if (action === "decrypt") {
      // Decrypt the file data with progress updates
      const decryptedData = rc5.decryptData(data, (progress) => {
        self.postMessage({ type: "update", process: "decryption", progress });
      });
      self.postMessage({
        type: "complete",
        process: "decryption",
        timeTaken: (performance.now() - startTime).toFixed(2),
        data: decryptedData.buffer,
      });
    }
  } catch (error) {
    console.error(error);
    self.postMessage({ type: "error", error: 'Error during encryption/decryption.' });
  }
};
