import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinearCongruentialGenerator, LinearCongruential } from "@/lib/core/lab1";
import { evaluate } from "mathjs";

const evaluateExp = (exp: string): string => {
  try {
    return evaluate(exp).toString();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return "Invalid expression";
  }
}

export default function Form() {
  const [modulus, setModulus] = useState<string>("2 ^ 29 -1 ");
  const [multiplier, setMultiplier] = useState<string>("16 ^ 3");
  const [increment, setIncrement] = useState<string>("6765");
  const [initialValue, setInitialValue] = useState<string>("23");
  const [result, setResult] = useState<string>("");

  const handleSubmit = () => {
    const lcg = new LinearCongruentialGenerator();
    const dto: LinearCongruential = {
      seed: evaluate(initialValue),
      a: evaluate(multiplier),
      c: evaluate(increment),
      m: evaluate(modulus),
      n: 10 // Example: Generating a sequence of 10 numbers
    };
    
    const sequence = lcg.generateSequence(dto);
    setResult(sequence.join(", ")); // Display the sequence as a comma-separated string
  };

  const handleDownload = () => {
    if (result) {
      const blob = new Blob([result], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "lcg-result.txt";
      link.click();
      URL.revokeObjectURL(url); // Clean up the URL object
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Linear Congruential Generator</CardTitle>
        <CardDescription>Generate a sequence of pseudo-random numbers using the LCG algorithm.</CardDescription>
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
            <Label htmlFor="initial-value">Initial Value (Початкове значення) - {evaluateExp(initialValue)}</Label>
            <Input 
              id="initial-value" 
              placeholder="Enter initial value" 
              value={initialValue} 
              onChange={(e) => setInitialValue(e.target.value)} 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="result">Result</Label>
          <Input id="result" type="text" value={result} placeholder="Result will be shown here" readOnly />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSubmit}>Calculate</Button>
        <Button variant="outline" onClick={handleDownload} disabled={!result}>
          {result ? "Download" : "No Result to Download"}
        </Button>
      </CardFooter>
    </Card>
  );
}
