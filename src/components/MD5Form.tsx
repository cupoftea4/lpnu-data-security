import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MD5 } from '@/lib/core/lab2'

const md5 = new MD5()

export default function Component() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateMD5 = (content: string) => {
    if (content.trim() === '') {
      setError('Please enter some text or upload a file to hash.')
      setResult('')
      return
    }

    setError('')
    const hash = md5.hash(content)
    setResult(hash)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as ArrayBuffer
        const binaryString = Array.from(new Uint8Array(content))
          .map(byte => String.fromCharCode(byte))
          .join('');
        generateMD5(binaryString)
      }
      reader.onerror = () => {
        setError('Error reading file.') 
      }
      // Read as ArrayBuffer to handle binary files like PDFs
      reader.readAsArrayBuffer(file)
    }
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
        <Button onClick={() => generateMD5(input)} className="w-full">Generate MD5 Hash</Button>
      </CardFooter>
    </Card>
  )
}