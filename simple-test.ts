// Test simple mapped type behavior
type TestMapped = {
  greet: string;
  pokemon: number;
};

type TestClient = {
  [K in keyof TestMapped]: TestMapped[K];
};

// This should work - test with a simple mapped type
const testObj: TestClient = {} as any;

// These should both fail:
const bad1 = testObj.greetx; // Property access
const bad2 = testObj['greetx']; // Bracket access

// Force type check
const testAssign: never = testObj['greetx'];

export { bad1, bad2, testAssign };
