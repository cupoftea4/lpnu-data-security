importScripts('/rc5.js');

self.onmessage = async (e) => {
  const { file, key } = e.data;
  const rc5 = new RC5(key);

  try {
    let startTime = performance.now();
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Encrypt the file data with progress updates
    const encryptedData = rc5.encryptData(data, (progress) => {
      self.postMessage({ type: "update", process: "encryption", progress });
    })
    self.postMessage({
      type: "complete",
      process: "encryption",
      timeTaken: (performance.now() - startTime).toFixed(2),
      encryptedData: encryptedData,
    });

    startTime = performance.now();
    
    // Decrypt the encrypted data with progress updates
    const decryptedData = rc5.decryptData(encryptedData, (progress) => {
      self.postMessage({ type: "update", process: "decryption", progress });
    })

    // Send completion event with the files once both encryption and decryption are done
    self.postMessage({
      type: "complete",
      process: "decryption",
      timeTaken: (performance.now() - startTime).toFixed(2),
      decryptedData: decryptedData,
    });

  } catch (error) {
    console.error(error);
    self.postMessage({ type: "error", error: 'Error during encryption/decryption.' });
  }
};
