import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MD5 } from "@/lib/core/lab2";

const CHUNK_BYTES = 64;

function* stringToBytesGenerator(string: string) {
  const arr = new TextEncoder().encode(string);
  if (!arr.length) {
    yield Promise.resolve(new Uint8Array([]));
  }
  for (let i = 0; i < arr.length; i += CHUNK_BYTES) {
    yield Promise.resolve(arr.slice(i, i + CHUNK_BYTES));
  }
}

const md5 = new MD5();

export default function Component() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeTaken, setTimeTaken] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsLoading(true);
      setProgress(0);
      setTimeTaken("");

      const worker = new Worker("/worker.js");
      worker.postMessage({
        file,
      });

      worker.onmessage = (e) => {
        const { type, hash, error, progress, timeTaken } = e.data;

        // Handle progress updates
        if (type === "update") {
          setProgress(parseFloat(progress));
        }

        // Handle final hash result
        if (type === "complete") {
          setResult(hash);
          setProgress(100);
          setTimeTaken(timeTaken);
          setIsLoading(false);
        }

        // Handle errors
        if (type === "error") {
          setError(error);
          setIsLoading(false);
        }
      };

      worker.onerror = () => {
        setError("Error processing file.");
        setIsLoading(false);
      };
    }
  };

  const generateMD5 = async (content: string) => {
    if (typeof content === "string") {
      content = content.trim();
    }

    setError("");
    const gen = stringToBytesGenerator(content);
    const hash = await md5.hashFromGenerator(gen);

    setResult(hash);
  };

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
              <Input id="file" type="file" onChange={handleFileUpload} ref={fileInputRef} />
              {fileName && <p className="text-sm text-muted-foreground">File: {fileName}</p>}
            </div>

            {isLoading && (
              <div className="mt-4">
                <Label htmlFor="progress">Progress</Label>
                <div className="relative w-full bg-zinc-400 rounded py-4 h-2">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-primary rounded"
                    style={{ width: `${progress}%` }}
                  ></div>
                  <span
                    className="absolute top-0 py-2
                   left-0 w-full text-center text-xs text-gray-50 "
                  >
                    {progress}% completed
                  </span>
                </div>
              </div>
            )}
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
            {timeTaken && (
              <p className="text-sm mt-2">Time Taken: {(+timeTaken / 1000).toFixed(2)} seconds</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={() => generateMD5(input)} className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate MD5 Hash"}
        </Button>
      </CardFooter>
    </Card>
  );
}
