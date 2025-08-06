import { HttpStatusCode } from '@congruentv/schematic';
import { createClient } from '@congruentv/schematic-adapter-fetch';
import { pokemonApiContract } from '@monorepo-example/contract';

const client = createClient(pokemonApiContract, {
  baseUrl: 'http://localhost:3000',
  headers: () => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dummy-node-token',
  }),
});

console.log('Greeting...');
const greetResponse = await client.greet.name('Ash').GET();
if (greetResponse.code !== HttpStatusCode.OK_200) {
  throw new Error(`Failed to greet: ${greetResponse.body}`);
}
console.log('Response:', greetResponse.body);

console.log('Greeting with preferred salute...');
const greetSaluteResponse = await client.greet.name('Ash').preferred.salute('Ola').GET();
if (greetSaluteResponse.code !== HttpStatusCode.OK_200) {
  throw new Error(`Failed to greet with salute: ${greetSaluteResponse.body}`);
}
console.log('Response:', greetSaluteResponse.body);

console.log('Greeting with preferred salute 2...');
const greetSaluteResponse2 = await client.greet.name('Ash')['preferred-salute'].salute('Ola').GET();
if (greetSaluteResponse2.code !== HttpStatusCode.OK_200) {
  throw new Error(`Failed to greet with salute: ${greetSaluteResponse2.body}`);
}
console.log('Response:', greetSaluteResponse2.body);

// listing all Pokemons
console.log('Fetching all Pokemons...');
const listResponse = await client.pokemon.GET({
  query: {
    take: '10',
    skip: 0,
  }
});
if (listResponse.code !== HttpStatusCode.OK_200) {
  throw new Error(`Failed to fetch Pokemons: ${listResponse.code} - ${JSON.stringify(listResponse.body, null, 2)}`);
}
console.log('Pokemons:', listResponse.body.list.map(p => p.name).join(', '));

// create a new Pokemon
console.log('Creating a new Pokemon...');
const postResponse = await client.pokemon.POST({
  headers: {
    'x-custom-header': 'custom-value',
  },
  body: {
    name: 'Squirtle',
    type: 'water',
    description: 'Water type Pokemon',
  }
});
if (postResponse.code !== HttpStatusCode.Created_201) {
  throw new Error(`Failed to create Pokemon: ${postResponse.body}`);
}
console.log('Pokemon created with ID:', postResponse.body);

// get the created Pokemon
console.log('Fetching the created Pokemon...');
const getResponse = await client.pokemon.id(postResponse.body).GET();
if (getResponse.code !== HttpStatusCode.OK_200) {
  throw new Error(`Failed to get Pokemon: ${getResponse.body}`);
}
console.log('Pokemon found:', getResponse.body.name);

// patch the created Pokemon
console.log('Updating the created Pokemon...');
const patchResponse = await client.pokemon.id(getResponse.body.id).PATCH({
  body: {
    description: 'Updated description for Squirtle',
  }
});
if (patchResponse.code !== HttpStatusCode.NoContent_204) {
  throw new Error(`Failed to update Pokemon: ${patchResponse.body}`);
}
console.log('Pokemon updated successfully');

// delete the created Pokemon
console.log('Deleting the created Pokemon...');
const deleteResponse = await client.pokemon.id(getResponse.body.id).DELETE();
if (deleteResponse.code !== HttpStatusCode.NoContent_204) {
  throw new Error(`Failed to delete Pokemon: ${deleteResponse.body}`);
}
console.log('Pokemon deleted successfully');
