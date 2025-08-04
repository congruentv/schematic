import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { ApiHandlersRegistry } from '@congruentv/schematic';
import { HttpStatusCode } from '@congruentv/schematic';
import { register, path } from '@congruentv/schematic-adapter-express';

import { 
  pokemonApiContract, 
  Pokemon 
} from '@monorepo-example/contract';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pokemons: Pokemon[] = [
  { id: 1, name: 'Bulbasaur', description: 'Grass type', type: 'grass' },
  { id: 2, name: 'Ivysaur', description: 'Grass type', type: 'grass' },
  { id: 3, name: 'Venusaur', description: 'Grass type', type: 'grass' },
  { id: 4, name: 'Charmander', description: 'Fire type', type: 'fire' },
  { id: 5, name: 'Charmeleon', description: 'Fire type', type: 'fire' },
  { id: 6, name: 'Charizard', description: 'Fire type', type: 'fire' },
];

const api = new ApiHandlersRegistry(pokemonApiContract);

//const endp1 = path(api, '/pokemon/:id/DELETE');
const endp2 = path(api, 'GET /pokemon/:id');
//const endp3 = path(pokemonApiContract, 'GET /pokemon/:id');
const endp4 = path(api, 'PATCH /pokemon/:id');
//api.pokemon[':id'].GET.

register(app, api.pokemon.GET, async ({ query }) => {
  return {
    code: HttpStatusCode.OK_200,
    body: {
      list: pokemons.slice(query.skip, query.take + query.skip),
      total: pokemons.length,
    },
  };
});

register(app, api.pokemon[':id'].GET, async ({ pathParams, headers }) => {
  console.log('Headers:', headers);
  const pokemon = pokemons.find(p => p.id.toString() === pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${pathParams.id} not found` } };
  }
  return { code: HttpStatusCode.OK_200, body: pokemon };
});

const endpGetPokemonById = path(api, 'GET /pokemon/:id');
register(app, endpGetPokemonById, async ({ pathParams, headers }) => {
  console.log('Headers:', headers);
  const pokemon = pokemons.find(p => p.id.toString() === pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${pathParams.id} not found` } };
  }
  return { code: HttpStatusCode.OK_200, body: pokemon };
});

register(app, api.pokemon[':id'].DELETE, async ({ pathParams }) => {
  const pokemon = pokemons.find(p => p.id.toString() === pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${pathParams.id} not found` } };
  }
  pokemons.splice(pokemons.indexOf(pokemon), 1);
  return { code: HttpStatusCode.NoContent_204 };
});

register(app, api.pokemon[':id'].PATCH, async ({ pathParams, body }) => {
  const pokemon = pokemons.find(p => p.id.toString() === pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${pathParams.id} not found` } };
  }
  Object.assign(pokemon, body);
  return { code: HttpStatusCode.NoContent_204 };
});

register(app, api.pokemon.POST, async ({ headers, body }) => {
  console.log('Headers:', headers);
  const newPokemon = {
    id: pokemons.length + 1,
    ...body,
  };
  pokemons.push(newPokemon);
  return {
    code: HttpStatusCode.Created_201,
    body: newPokemon.id,
  };
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});