// Test using exact same imports as the problematic file
import { createClient } from '@congruentv/schematic-adapter-fetch';
import { pokemonApiContract } from '@monorepo-example/contract';

const client = createClient(pokemonApiContract, {
  baseUrl: 'http://localhost:3000',
  headers: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy-node-token',
  }),
});

// Test the exact same line that's problematic
const problematicLine = client['greetx'];

// Force type check
const typeCheck: never = problematicLine;

export { problematicLine, typeCheck };
