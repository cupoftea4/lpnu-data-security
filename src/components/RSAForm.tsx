import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import RSAService from '@/lib/core/lab4'

const rsaService = new RSAService();

export default function RSAAlgorithmUI() {
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [fileToEncrypt, setFileToEncrypt] = useState<File | null>(null)
  const [fileToDecrypt, setFileToDecrypt] = useState<File | null>(null)
  const [encryptedData, setEncryptedData] = useState<ArrayBuffer | null>(null)
  const [decryptedData, setDecryptedData] = useState<string | null>('')

  const encryptInputRef = useRef<HTMLInputElement | null>(null);
  const decryptInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to download the encrypted/decrypted file
  const downloadFile = (data: ArrayBuffer, filename: string) => {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateKeys = async () => {
    try {
      const keys = await rsaService.generateKeys();
      setPublicKey(keys.publicKey);
      setPrivateKey(keys.privateKey);
    } catch (error) {
      alert('Key generation failed.');
      console.error(error);
    }
  };

  const handleFileEncryptChange = (file: File | null) => {
    setFileToEncrypt(file);
  };

  const encryptFile = async () => {
    if (!fileToEncrypt) {
      alert('Please select a file to encrypt.');
      return;
    }

    try {
      const encrypted = await rsaService.encryptFile(fileToEncrypt);
      setEncryptedData(encrypted);
    } catch (error) {
      alert('Encryption failed.');
      console.error(error);
    }
  };

  const handleFileDecryptChange = (file: File | null) => {
    setFileToDecrypt(file);
  };

  const decryptFile = async () => {
    if (!fileToDecrypt) {
      alert('Please select a file to decrypt.');
      return;
    }

    try {
      const encrypted = await fileToDecrypt.arrayBuffer();
      const decrypted = await rsaService.decryptFile(encrypted);
      setDecryptedData(new TextDecoder().decode(decrypted));
    } catch (error) {
      alert('Decryption failed.');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RSA Key Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateKeys}>Generate RSA Key Pair</Button>
          <div className="space-y-2">
            <Label htmlFor="publicKey">Public Key</Label>
            <Textarea id="publicKey" value={publicKey} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="privateKey">Private Key</Label>
            <Textarea id="privateKey" value={privateKey} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Encryption</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={encryptInputRef} // Reference to the file input
            type="file"
            onChange={(e) => handleFileEncryptChange(e.target.files?.[0] || null)}
          />
          <Button onClick={encryptFile}>Encrypt File</Button>
          {encryptedData && (
            <div className="space-y-2">
              <Button onClick={() => downloadFile(encryptedData, 'encrypted_file.bin')}>
                Download Encrypted File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Decryption</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            ref={decryptInputRef} // Reference to the file input
            type="file"
            onChange={(e) => handleFileDecryptChange(e.target.files?.[0] || null)}
          />
          <Button onClick={decryptFile}>Decrypt File</Button>
          {decryptedData && (
            <div className="space-y-2">
              <Label htmlFor="decryptedData">Decrypted Data</Label>
              <Textarea id="decryptedData" value={decryptedData} readOnly />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
