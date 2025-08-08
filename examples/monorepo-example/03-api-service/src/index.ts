import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { createRegistry, LowerCasedHttpMethod, HttpStatusCode, route, register } from '@congruentv/schematic';
// import { register } from '@congruentv/schematic-adapter-express';

import { 
  pokemonApiContract, 
  Pokemon 
} from '@monorepo-example/contract';

console.log('Waiting 10 secs...');
await new Promise(resolve => setTimeout(resolve, 10000)); // wait for the contract to be ready
console.log('Ready');

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

const api = createRegistry(pokemonApiContract, (entry) => {
  console.log('OOO Handler registered for endpoint:', entry.methodEndpoint.method, entry.methodEndpoint.genericPath);
  const { genericPath } = entry.methodEndpoint;
  const method = entry.methodEndpoint.method.toLowerCase() as LowerCasedHttpMethod;
  app[method](genericPath, async (req, res) => {
    console.log('incoming request:', req.method, req.path);
    const pathParams = req.params;
    const query = req.query;
    const body = req.body;
    const headers = JSON.parse(JSON.stringify(req.headers)); // TODO
    const result = await entry.trigger({
      headers,
      pathParams,
      query,
      body,
    });
    res.status(result.code).json(result.body);
  });
});

// register(/*app,*/api.greet[':name'].GET, async (req) => {
//   const name = req.pathParams.name;
//   return {
//     code: HttpStatusCode.OK_200,
//     body: `Hello, ${name}!`,
//   };
// });

// register(/*app,*/api.greet[':name'].preferred[':salute'].GET, async (req) => {
//   const name = req.pathParams.name;
//   const salute = req.pathParams.salute;
//   return {
//     code: HttpStatusCode.OK_200,
//     body: `${salute}, ${name}!`,
//   };
// });

// register(/*app,*/api.greet[':name']['preferred-salute'][':salute'].GET, async (req) => {
//   const name = req.pathParams.name;
//   const salute = req.pathParams.salute;
//   return {
//     code: HttpStatusCode.OK_200,
//     body: `${salute}, ${name}!`,
//   };
// });

register(/*app,*/api, 'GET /greet/:name', async (req) => {
  const name = req.pathParams.name;
  return {
    code: HttpStatusCode.OK_200,
    body: `Hello, ${name}!`,
  };
});

register(/*app,*/api, 'GET /greet/:name/preferred/:salute', async (req) => {
  const name = req.pathParams.name;
  const salute = req.pathParams.salute;
  return {
    code: HttpStatusCode.OK_200,
    body: `${salute}, ${name}!`,
  };
});

register(/*app,*/api, 'GET /greet/:name/preferred-salute/:salute', async (req) => {
  const name = req.pathParams.name;
  const salute = req.pathParams.salute;
  return {
    code: HttpStatusCode.OK_200,
    body: `${salute}, ${name}!`,
  };
});

register(/*app,*/api.pokemon.GET, async (req) => {
  req.pathParams
  return {
    code: HttpStatusCode.OK_200,
    body: {
      list: pokemons.slice(req.query.skip, req.query.take + req.query.skip),
      total: pokemons.length,
    },
  };
});

register(/*app,*/api.pokemon[':id'].GET, async (req) => {
  console.log('Headers:', req.headers);
  const pokemon = pokemons.find(p => p.id.toString() === req.pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
  }
  return { code: HttpStatusCode.OK_200, body: pokemon };
});

register(/*app,*/api, 'PATCH /pokemon/:id', async (req) => {
  const pokemon = pokemons.find(p => p.id.toString() === req.pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
  }
  Object.assign(pokemon, req.body);
  return { code: HttpStatusCode.NoContent_204 };
});

register(/*app,*/api, 'POST /pokemon', async (req) => {
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

register(/*app,*/route(api, 'DELETE /pokemon/:id'), async (req) => {
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