// Test using actual schematic types to reproduce the issue

import z from 'zod';
import { 
  apiContract, 
  endpoint, 
  response, 
  HttpStatusCode as s
} from '@congruentv/schematic';
import { createClient } from '@congruentv/schematic-adapter-fetch';

// Create a contract that matches the pokemon structure exactly with computed properties
const testContractWithParams = apiContract({
  greet: {
    [':name']: {
      GET: endpoint({
        responses: {
          [s.OK_200]: response({ body: z.string() }),
        }
      }),
      preferred: {
        [':salute']: {
          GET: endpoint({
            responses: {
              [s.OK_200]: response({ body: z.string() }),
            }
          })
        }
      }
    }
  },
  pokemon: {
    GET: endpoint({
      responses: {
        [s.OK_200]: response({ body: z.object({ id: z.number() }) }),
      }
    })
  }
});

// Create client
const client = createClient(testContractWithParams, {
  baseUrl: 'http://localhost:3000',
});

console.log('=== Actual Schematic Client Test ===');

// Test property access (should fail)
const bad1 = client.greetx;

// Test bracket access (should fail but might not)
const bad2 = client['greetx'];

// Valid accesses (should work)
const good1 = client.greet;
const good2 = client['greet'];

// Force type checks
const typeCheck1: never = bad2;

export { bad1, bad2, good1, good2, typeCheck1 };
