import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { evaluate } from "mathjs";
import { Loader2 } from "lucide-react";

const evaluateExp = (exp: string): string => {
  try {
    return evaluate(exp).toString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return "Invalid expression";
  }
};

export default function Form() {
  const [modulus, setModulus] = useState<string>("2 ^ 29 -1 ");
  const [multiplier, setMultiplier] = useState<string>("16 ^ 3");
  const [increment, setIncrement] = useState<string>("6765");
  const [initialValue, setInitialValue] = useState<string>("23");
  const [nValue, setNValue] = useState<string>("150"); // New field for n
  const [result, setResult] = useState<string>("");
  const [status, setStatus] = useState<"Idle" | "In Progress" | "Error" | "Finished">("Idle");
  const [fileLink, setFileLink] = useState<string>(""); // For the file link

  const handleSubmit = () => {
    const config = {
      seed: evaluate(initialValue),
      a: evaluate(multiplier),
      c: evaluate(increment),
      m: evaluate(modulus),
      n: evaluate(nValue), // Use the value of n from the input
    };
    setStatus("In Progress");
    // Send POST request to the backend
    fetch("http://localhost:3000/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ config }),
    })
      .then((response) => response.json())
      .then((data: { filePath: string, status: string, shortenedResult: number[], message: string}) => {
        if (data.status === "finished") {
          const file = "http://localhost:3000/" + data.filePath;
          setFileLink(file); // File path returned in finished response
          setResult(data.shortenedResult.join(", "));
          setStatus("Finished");
        } else {
          setResult(data.message);
          setStatus("Error");
        }
      })
      .catch(() => {
        setStatus("Error");
        setResult("An error occurred during execution.");
      });
  };

  const handleDownload = () => {
    if (fileLink) {
      const link = document.createElement("a");
      link.href = fileLink;
      link.download = "lcg-result.txt"; 
      link.target = "_blank"; 
      document.body.appendChild(link); 
      link.click(); 
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Linear Congruential Generator</CardTitle>
        <CardDescription>
          Generate a sequence of pseudo-random numbers using the LCG algorithm.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="modulus">Modulus (Модуль порівняння) - {evaluateExp(modulus)}</Label>
            <Input
              id="modulus"
              placeholder="Enter modulus"
              value={modulus}
              onChange={(e) => setModulus(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="multiplier">Multiplier (Множник) - {evaluateExp(multiplier)}</Label>
            <Input
              id="multiplier"
              placeholder="Enter multiplier"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="increment">Increment (Приріст) - {evaluateExp(increment)}</Label>
            <Input
              id="increment"
              placeholder="Enter increment"
              value={increment}
              onChange={(e) => setIncrement(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial-value">
              Initial Value (Початкове значення) - {evaluateExp(initialValue)}
            </Label>
            <Input
              id="initial-value"
              placeholder="Enter initial value"
              value={initialValue}
              onChange={(e) => setInitialValue(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nValue">N (Кількість) - {nValue}</Label> {/* New field for N */}
          <Input
            id="nValue"
            placeholder="Enter n"
            value={nValue}
            onChange={(e) => setNValue(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="result">Status: {status}</Label>
          <Input id="result" type="text" value={result} placeholder="Result will be shown here" readOnly />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSubmit} disabled={status === "In Progress"}>
          {status === "In Progress" ? <Loader2 className="animate-spin h-5 w-5" /> : "Run"}
        </Button>
        <Button variant="outline" onClick={handleDownload} disabled={!fileLink}>
          {fileLink ? "Download" : "No File Available"}
        </Button>
      </CardFooter>
    </Card>
  );
}
