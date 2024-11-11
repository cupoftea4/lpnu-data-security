import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import DSS from '@/lib/core/lab5'

const dss = new DSS();
const { publicKey, privateKey } = await dss.generateKeyPair()

export default function DigitalSignatureTool() {
  const [activeTab, setActiveTab] = useState('text')
  const [textInput, setTextInput] = useState('')
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [output, setOutput] = useState('')
  const [signature, setSignature] = useState('')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value)
  }

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSignatureFile(e.target.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileInput(e.target.files[0])
    }
  }

  const readSignatureFileAsHex = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => {
        console.error("File read error:", error);
        reject(new Error("Failed to read the signature file. Please check the file format and try again."));
      };
      reader.readAsText(file);
    });
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = (error) => {
        console.error("File read error:", error);
        reject(new Error("Failed to read the input file. Please check the file format and try again."));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const generateSignature = async () => {
    try {
      let data: ArrayBuffer

      if (activeTab === 'text') {
        data = new TextEncoder().encode(textInput)
      } else if (activeTab === 'file' && fileInput) {
        data = await readFileAsArrayBuffer(fileInput)
      } else if (activeTab === 'signature') {
        setOutput('Cannot generate signature from signature file.')
        return
      } else {
        throw new Error('No input provided')
      }

      const signature = await dss.signData(privateKey, data)
      setSignature(dss.toHex(signature))
      setOutput('')
    } catch (error) {
      setOutput(`Error generating signature: ${error}`)
    }
  }

  const verifySignature = async () => {
    try {
      let data: ArrayBuffer;
      if (activeTab === 'text') {
        data = new TextEncoder().encode(textInput);
      } else if ((activeTab === 'file' || activeTab === 'signature') && fileInput) {
        data = await readFileAsArrayBuffer(fileInput)
      } else {
        throw new Error('No input provided');
      }

      if (activeTab === 'signature' && !signatureFile) {
        setOutput('No signature file provided.');
        return;
      }

      let sig: ArrayBuffer;
      if (signatureFile) {
        const hexSig = await readSignatureFileAsHex(signatureFile);
        sig = dss.fromHex(hexSig);
      } else {
        sig = dss.fromHex(signature);
      }

      const isValid = await dss.verifySignature(publicKey, sig, data);
      setOutput(`Signature Verification: ${isValid ? 'Valid' : 'Invalid'}`);
    } catch (error) {
      console.error(error)
      setOutput(`Error verifying signature: ${error}`);
    }
  };

  const downloadSignature = () => {
    if (!signature) {
      setOutput('No signature to download.')
      return
    }

    const blob = new Blob([signature], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'signature.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="signature">Signature Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-4">
            <Textarea
              placeholder="Enter text to sign or verify"
              value={textInput}
              onChange={handleTextChange}
              className="w-full h-32"
            />
          </TabsContent>
          <TabsContent value="file" className="mt-4">
            <Input
              type="file"
              onChange={handleFileChange}
              className="w-full"
            />
            {fileInput && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileInput.name}</p>}
          </TabsContent>
          <TabsContent value="signature" className="mt-4">
            <Input type="file" onChange={handleFileChange} className="w-full" />
            {fileInput && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileInput.name}</p>}
            <Input type="file" onChange={handleSignatureFileChange} className="w-full mt-2" placeholder="Upload Signature File" />
            {signatureFile && <p className="mt-2 text-sm text-muted-foreground">Signature file: {signatureFile.name}</p>}
          </TabsContent>
        </Tabs>

        <div className={`grid gap-4 mt-6 md:grid-cols-2 ${activeTab === 'signature' ? 'md:grid-cols-1' : ''}`}>
          {activeTab !== 'signature' && (
            <Button onClick={generateSignature}>Generate Signature</Button>
          )}
          <Button onClick={verifySignature}>Verify Signature</Button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Output:</h3>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto">
            {output || signature || 'No output yet'}
          </pre>
        </div>
        <div className="mt-6 w-full flex justify-center">
          {signature && activeTab !== 'signature' && (
            <Button onClick={downloadSignature} className="w-full">Download Signature</Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}