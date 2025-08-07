// Step-by-step reproduction of the bracket notation issue

// Step 1: Simple test - this should work correctly
type SimpleTest = {
  greet: string;
  pokemon: number;
};

const simpleObj: SimpleTest = {} as any;

// These should both fail:
const simple1 = simpleObj.greetx; // Property access - should fail ✓
const simple2 = simpleObj['greetx']; // Bracket access - should fail but might not ❌

console.log('=== Simple Test ===');
console.log('Property access error expected');
console.log('Bracket access error expected');

// Step 2: Test with mapped type like ApiHandlersRegistryDef
type RegistryLikeTest<T extends object> = {
  [K in keyof T]: T[K];
};

const registryLike: RegistryLikeTest<SimpleTest> = {} as any;

const registry1 = registryLike.greetx; // Property access
const registry2 = registryLike['greetx']; // Bracket access

console.log('=== Registry-like Test ===');

// Step 3: Test with key remapping like ApiClientDef
type ClientLikeTest<T extends object> = {
  [K in keyof T as K extends `:${infer P}` ? P : K]: T[K];
};

const clientLike: ClientLikeTest<SimpleTest> = {} as any;

const client1 = clientLike.greetx; // Property access
const client2 = clientLike['greetx']; // Bracket access

console.log('=== Client-like Test ===');

// Step 4: Test with complex remapping and conditions
type ComplexTest<T extends object> = {
  [K in keyof T as K extends `:${infer P}` ? P : K]: 
    K extends `:${string}` 
      ? never 
      : T[K];
};

const complexObj: ComplexTest<SimpleTest> = {} as any;

const complex1 = complexObj.greetx; // Property access
const complex2 = complexObj['greetx']; // Bracket access

console.log('=== Complex Test ===');

// Step 5: Force type checks to see what types we get
const forceCheck1: never = simple2;
const forceCheck2: never = registry2;
const forceCheck3: never = client2;
const forceCheck4: never = complex2;

export {
  simple1, simple2,
  registry1, registry2,
  client1, client2,
  complex1, complex2,
  forceCheck1, forceCheck2, forceCheck3, forceCheck4
};
