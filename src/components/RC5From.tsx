import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
import { MD5 } from "@/lib/core/lab2";

export default function RC5Form() {
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [encryptedFile, setEncryptedFile] = useState<Uint8Array | null>(null);
  const [decryptedFile, setDecryptedFile] = useState<Uint8Array | null>(null);
  const [encryptionTime, setEncryptionTime] = useState<string | null>(null);
  const [decryptionTime, setDecryptionTime] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("RC5Form", decryptionTime, encryptionTime);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && password) {
      setFileName(file.name);
      setError(null);
      setIsLoading(true);
      setEncryptionProgress(0);
      setDecryptionProgress(0);
      setEncryptedFile(null);
      setDecryptedFile(null);
      setEncryptionTime(null);
      setDecryptionTime(null);

      const md5 = new MD5();

      // Generate the first MD5 hash from the password
      const passwordHash1 = await md5.hashStr(password);

      // Generate the second MD5 hash from the first hash
      const passwordHash2 = await md5.hashStr(passwordHash1);

      // Convert both hashes (which are hex strings) into a 32-byte key
      const key = new Uint8Array(32);
      for (let i = 0; i < 16; i++) {
        // First 16 bytes from the second hash (H(H(P)))
        key[i] = parseInt(passwordHash2.substring(i * 2, 2), 16);
        // Next 16 bytes from the first hash (H(P))
        key[i + 16] = parseInt(passwordHash1.substring(i * 2, 2), 16);
      }

      const worker = new Worker("/worker-rc5.js");
      worker.postMessage({ file, key });

      worker.onmessage = (e) => {
        const { type, process, progress, timeTaken } = e.data;

        if (type === "update") {
          if (process === "encryption") {
            setEncryptionProgress(progress);
          } else if (process === "decryption") {
            setDecryptionProgress(progress);
          }
        }

        if (type === "complete") {
          console.log(e.data);
          if (process === "encryption") {
            setEncryptedFile(e.data.encryptedData);
            setEncryptionTime(timeTaken);
          } else if (process === "decryption") {
            setDecryptedFile(e.data.decryptedData);
            setDecryptionTime(timeTaken);
            setIsLoading(false);
          }
        }

        if (type === "error") {
          setError(e.data.error);
          setIsLoading(false);
        }
      };

      worker.onerror = () => {
        setError("Error processing file.");
        setIsLoading(false);
      };
    } else {
      setError("Please provide both a file and a key.");
    }
  };

  const generateFileName = (suffix: string) => {
    if (!fileName) return "";
    const [name, ext] = fileName.split(/(?=\.[^.]+$)/); // Keep extension
    return `${name}_${suffix}${ext || ""}`;
  };

  const downloadFile = (data: Uint8Array | null, filename: string) => {
    if (!data) return;
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>RC5 Encryption</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="key">Encryption Key</Label>
            <Input
              id="key"
              placeholder="Enter encryption key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="file">Upload File</Label>
            <Input id="file" type="file" onChange={handleFileUpload} ref={fileInputRef} />
          </div>

          {(encryptionTime || decryptionTime || isLoading) && (
            <>
              <div className="mt-4">
                <Label>Encryption Progress</Label>
                {encryptionTime && (
                  <p className="text-sm mt-2">Time Taken: {(+encryptionTime / 1000).toFixed(2)} seconds</p>
                )}
                {isLoading && (
                  <div className="relative w-full bg-zinc-400 rounded h-2">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-primary rounded"
                      style={{ width: `${encryptionProgress}%` }}
                    ></div>
                    <span className="absolute top-0 py-2 left-0 w-full text-center text-xs text-gray-50">
                      {encryptionProgress}% completed
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Label>Decryption Progress</Label>
                {decryptionTime && (
                  <p className="text-sm mt-2">Time Taken: {(+decryptionTime / 1000).toFixed(2)} seconds</p>
                )}
                {isLoading && (
                  <div className="relative w-full bg-zinc-400 rounded h-2">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-primary rounded"
                      style={{ width: `${decryptionProgress}%` }}
                    ></div>
                    <span className="absolute top-0 py-2 left-0 w-full text-center text-xs text-gray-50">
                      {decryptionProgress}% completed
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex space-x-2">
        <Button
          onClick={() => downloadFile(encryptedFile, generateFileName("encrypted"))}
          disabled={!encryptedFile}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Encrypted File
        </Button>
        <Button
          onClick={() => downloadFile(decryptedFile, generateFileName("decrypted"))}
          disabled={!decryptedFile}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Decrypted File
        </Button>
      </CardFooter>
    </Card>
  );
}
