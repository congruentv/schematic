// Test file to verify the fix for bracket notation type safety

import { createClient } from './packages/schematic-adapter-fetch/src/index.js';
import { ApiContract } from './packages/schematic/src/index.js';

// Create a simple contract for testing
const testContract = new ApiContract({
  greet: {
    GET: {
      responses: { 200: { body: {} } }
    }
  }
});

const client = createClient(testContract, {
  baseUrl: 'http://localhost:3000',
});

// These should work fine
const ok1 = client.greet;  // ✓ Property access
const ok2 = client['greet'];  // ✓ Bracket notation with existing property

// This should now cause a TypeScript error instead of returning 'any'
const shouldError = client['nonExistentProperty'];  // ❌ Should be type 'never'

export { shouldError };
