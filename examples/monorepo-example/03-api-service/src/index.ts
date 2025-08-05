import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { createRegistry } from '@congruentv/schematic';
import { HttpStatusCode, route } from '@congruentv/schematic';
import { register, registerByPath } from '@congruentv/schematic-adapter-express';

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

const api = createRegistry(pokemonApiContract);

register(app, api.pokemon.GET, async (req) => {
  return {
    code: HttpStatusCode.OK_200,
    body: {
      list: pokemons.slice(req.query.skip, req.query.take + req.query.skip),
      total: pokemons.length,
    },
  };
});

register(app, api.pokemon[':id'].GET, async (req) => {
  console.log('Headers:', req.headers);
  const pokemon = pokemons.find(p => p.id.toString() === req.pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
  }
  return { code: HttpStatusCode.OK_200, body: pokemon };
});

registerByPath(app, api, 'PATCH /pokemon/:id', async (req) => {
  const pokemon = pokemons.find(p => p.id.toString() === req.pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
  }
  Object.assign(pokemon, req.body);
  return { code: HttpStatusCode.NoContent_204 };
});

registerByPath(app, api, 'POST /pokemon', async (req) => {
  console.log('Headers:', req.headers);
  const newPokemon = {
    id: pokemons.length + 1,
    ...req.body,
  };
  pokemons.push(newPokemon);
  return {
    code: HttpStatusCode.Created_201,
    body: newPokemon.id,
  };
});

register(app, route(api, 'DELETE /pokemon/:id'), async (req) => {
  const pokemon = pokemons.find(p => p.id.toString() === req.pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
  }
  pokemons.splice(pokemons.indexOf(pokemon), 1);
  return { code: HttpStatusCode.NoContent_204 };
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});