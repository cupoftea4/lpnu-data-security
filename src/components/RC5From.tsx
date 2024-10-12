import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Download, LucideTimer } from "lucide-react";
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

  const processFile = async (action: "encrypt" | "decrypt") => {
    if (!password) {
      setError("Please provide a key.");
      return;
    }

    const md5 = new MD5();
    const passwordHash1 = await md5.hashStr(password);
    const passwordHash2 = await md5.hashStr(passwordHash1);
    const key = new Uint8Array(32);
    for (let i = 0; i < 16; i++) {
      key[i] = parseInt(passwordHash2.substring(i * 2, i * 2 + 2), 16);
      key[i + 16] = parseInt(passwordHash1.substring(i * 2, i * 2 + 2), 16);
    }

    let fileData: Uint8Array | null = null;
    if (action === "encrypt") {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError("Please select a file to encrypt.");
        return;
      }
      setFileName(file.name);
      fileData = new Uint8Array(await file.arrayBuffer());
    } else if (action === "decrypt") {
      if (!encryptedFile) {
        setError("No encrypted file available to decrypt.");
        return;
      }
      fileData = encryptedFile;
    }

    if (fileData) {
      setError(null);
      setIsLoading(true);
      setEncryptionProgress(0);
      setDecryptionProgress(0);

      const worker = new Worker("/worker-rc5.js");
      worker.postMessage({ file: fileData, key, action });

      worker.onmessage = (e) => {
        const { type, process, progress, timeTaken, data } = e.data;

        if (type === "update") {
          if (process === "encryption") {
            setEncryptionProgress(progress);
          } else if (process === "decryption") {
            setDecryptionProgress(progress);
          }
        }

        if (type === "complete") {
          if (process === "encryption") {
            setEncryptedFile(new Uint8Array(data));
            setEncryptionTime(timeTaken);
          } else if (process === "decryption") {
            setDecryptedFile(new Uint8Array(data));
            setDecryptionTime(timeTaken);
          }
          setIsLoading(false);
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
        <CardTitle>RC5 Encryption/Decryption</CardTitle>
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
            <Input id="file" type="file" ref={fileInputRef} />
          </div>

          {(encryptionTime || isLoading) && (
            <div className="mt-4">
              <Label>Encryption Progress</Label>
              {encryptionTime && (
                <div className="flex items-center gap-1 mt-1">
                  <LucideTimer />
                  <p className="text-sm">{(+encryptionTime / 1000).toFixed(2)} seconds</p>
                </div>
              )}
              {(isLoading && encryptionProgress) ? (
                <div className="relative w-full bg-zinc-400 rounded h-2 mt-2 py-4">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-primary rounded"
                    style={{ width: `${encryptionProgress}%` }}
                  ></div>
                  <span className="absolute top-0 py-2 left-0 w-full text-center text-xs text-gray-50">
                    {encryptionProgress}% completed
                  </span>
                </div>
              ) : null}
            </div>
          )}
          {(decryptionTime || isLoading) && (
            <div className="mt-4">
              <Label>Decryption Progress</Label>
              {decryptionTime && (
                <div className="flex items-center gap-1 mt-1">
                  <LucideTimer />
                  <p className="text-sm">{(+decryptionTime / 1000).toFixed(2)} seconds</p>
                </div>
              )}
              {isLoading && decryptionProgress ? (
                <div className="relative w-full bg-zinc-400 rounded h-2 mt-2">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-primary rounded"
                    style={{ width: `${decryptionProgress}%` }}
                  ></div>
                  <span className="absolute top-0 py-2 left-0 w-full text-center text-xs text-gray-50">
                    {decryptionProgress}% completed
                  </span>
                </div>
              ) : null}
            </div>
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
      <CardFooter className="flex space-y-2 flex-col">
        <div className="flex space-x-2 w-full">
          <Button
            onClick={() => processFile("encrypt")}
            disabled={!password || isLoading}
            className="w-full flex items-center"
          >
            Encrypt
            {encryptedFile && <CheckCircle className="ml-1" />}
          </Button>
          <Button
            onClick={() => processFile("decrypt")}
            disabled={!password || isLoading || !encryptedFile}
            className="w-full  flex items-center"
          >
            Decrypt
            {decryptedFile && <CheckCircle className="ml-1" />}
          </Button>
        </div>
        <div className="flex space-x-2 w-full">
          <Button
            className="w-full"
            onClick={() => downloadFile(encryptedFile, generateFileName("encrypted"))}
            disabled={!encryptedFile}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Encrypted File
          </Button>
          <Button
            className="w-full"
            onClick={() => downloadFile(decryptedFile, generateFileName("decrypted"))}
            disabled={!decryptedFile}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Decrypted File
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
