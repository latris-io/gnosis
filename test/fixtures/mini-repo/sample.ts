// test/fixtures/mini-repo/sample.ts
// @implements STORY-64.1

/**
 * Sample class for testing
 */
export class SampleClass {
  private value: number;
  
  constructor(value: number) {
    this.value = value;
  }
  
  getValue(): number {
    return this.value;
  }
}

/**
 * Sample function
 */
export function sampleFunction(x: number): number {
  return x * 2;
}

