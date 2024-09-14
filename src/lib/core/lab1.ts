export type LinearCongruential = {
  seed: number;
  a: number;
  c: number;
  m: number;
  n: number;
}

export class LinearCongruentialGenerator {
  generate({ seed, a, c, m }: Omit<LinearCongruential, 'n'>): number {
    return (a * seed + c) % m;
  }

  generateSequence(input: LinearCongruential): number[] {
    const { n, ...rest } = input;
    const sequence: number[] = new Array(n);
    
    sequence[0] = this.generate({ ...rest, seed: input.seed });
    
    for (let i = 1; i < n; i++) {
      sequence[i] = this.generate({ ...rest, seed: sequence[i - 1] });
    }
    
    return sequence;
  }
}
