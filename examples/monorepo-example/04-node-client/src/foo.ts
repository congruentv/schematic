import { createClient } from '@congruentv/schematic-adapter-fetch';
import { pokemonApiContract } from '@monorepo-example/contract';

const client = createClient(pokemonApiContract, {
  baseUrl: 'http://localhost:3000',
  headers: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy-node-token',
  }),
});

const ok1 = client.greet

const ok2_greetx_does_not_exists = client.greetx

const ok3 = client['greet']

const not_ok_has_type_any = client['greetx'] // <-- should now show "Property does not exist" error

// const test: string = client['greetx'] // Force type check - this should fail if type is 'never'  

// // Force individual checks
// const check1 = client['greetx'];
// const check2: string = client['greetx']; 
// const check3: never = client['greetx'];

// // Let's also test assignment to force the error to appear
// const shouldBeNever: never = client['greetx'];

// // Add a small change to trigger re-analysis
// const dummy = 2; // Changed from 1 to 2