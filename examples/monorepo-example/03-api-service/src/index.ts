import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { ApiHandlersRegistrar } from '@congruentv/schematic';
import { HttpStatusCode } from '@congruentv/schematic';
import { configureEndpoint } from '@congruentv/schematic-adapter-express';

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


const pokemonApi = new ApiHandlersRegistrar(pokemonApiContract);

configureEndpoint(app, pokemonApi.pokemon.GET, async ({ query }) => {
  return {
    code: HttpStatusCode.OK_200,
    payload: {
      list: pokemons.slice(query.skip, query.take + query.skip),
      total: pokemons.length,
    },
  };
});

configureEndpoint(app, pokemonApi.pokemon[':id'].GET, async ({ pathParams }) => {
  const pokemon = pokemons.find(p => p.id.toString() === pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, payload: { userMessage: `Pokemon with ID ${pathParams.id} not found` } };
  }
  return { code: HttpStatusCode.OK_200, payload: pokemon };
});

configureEndpoint(app, pokemonApi.pokemon.POST, async ({ body }) => {
  const newPokemon = {
    id: pokemons.length + 1,
    ...body,
  };
  pokemons.push(newPokemon);
  return {
    code: HttpStatusCode.Created_201,
    payload: newPokemon,
  };
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});