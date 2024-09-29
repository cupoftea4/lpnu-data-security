import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MD5 } from '@/lib/core/lab2'


const FILE_READER_CHUNK_SIZE = 1024 * 128; // 128 KB chunks
const CHUNK_BYTES = 64; // 64 KB sub-chunks within each chunk


function* stringToBytesGenerator(string: string) {
  const arr = new TextEncoder().encode(string);
  if (!arr.length) {
    yield Promise.resolve(new Uint8Array([]));
  }
  for (let i = 0; i < arr.length; i += CHUNK_BYTES) {
    yield Promise.resolve(arr.slice(i, i + CHUNK_BYTES));
  }
}


const md5 = new MD5()

export default function Component() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      
      setIsLoading(true);

      const worker = new Worker('/worker.js');
      worker.postMessage({
        file,
        FILE_READER_CHUNK_SIZE,
        CHUNK_BYTES,
      });

      worker.onmessage = (e) => {
        const { hash, error } = e.data;
        if (error) {
          setError(error);
        } else {
          setResult(hash);
        }
        setIsLoading(false);
      };

      worker.onerror = () => {
        setError('Error processing file.');
        setIsLoading(false);
      };
    }
  };

  const generateMD5 = async (content: string) => {
    if (typeof content === 'string') {
      content = content.trim()
    }

    setError('')
    const gen = stringToBytesGenerator(content)
    const hash = await md5.hashFromGenerator(gen)

    setResult(hash)
  }


  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>MD5 Hash Generator</CardTitle>
        <CardDescription>Enter text or upload a file to generate its MD5 hash</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="input">Input Text</Label>
              <Input 
                id="input" 
                placeholder="Enter text here" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
          </TabsContent>
          <TabsContent value="file">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="file">Upload File</Label>
              <Input 
                id="file" 
                type="file" 
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
              {fileName && <p className="text-sm text-muted-foreground">File: {fileName}</p>}
            </div>
          </TabsContent>
        </Tabs>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <div className="flex flex-col space-y-1.5 mt-4">
            <Label htmlFor="result">MD5 Hash</Label>
            <Input id="result" value={result} readOnly />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => generateMD5(input)} className="w-full" disabled={isLoading}>
          { isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> :
          "Generate MD5 Hash"}
        </Button>
      </CardFooter>
    </Card>
  )
}
