import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { HttpStatusCode, route, register, partialPathString, partial } from '@congruentv/schematic';
import { createExpressRegistry, expressPreHandler } from '@congruentv/schematic-adapter-express';

import { 
  pokemonApiContract, 
  Pokemon 
} from '@monorepo-example/contract';

// console.log('Waiting 10 secs...');
// await new Promise(resolve => setTimeout(resolve, 10000)); // wait
// console.log('Ready');

//const expressRouter = express.Router();

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

const api = createExpressRegistry(app, pokemonApiContract);

app.use(partialPathString(api, '/greet/:name'), (req, _res, next) => {
  console.log('(x) Middleware for /greet/:name', req.params.name);
  next();
  console.log('(y) Middleware for /greet/:name', req.params.name);
});

register(api, 'GET /greet/:name', async (req) => {
  const name = req.pathParams.name;
  return {
    code: HttpStatusCode.OK_200,
    body: `Hello, ${name}!`,
  };
});

route(api, `GET /greet/:name/preferred/:salute`)
//api.greet[':name'].preferred[':salute'].GET
  .prepare(({ methodEndpoint: { lowerCasedMethod, genericPath }}) => {
    app[lowerCasedMethod](genericPath, (req, _res, next) => {
      console.log('(a) endpoint hit', req.method, req.path);
      next();
      console.log('(b) endpoint finished', req.method, req.path);
    });
  })
  .prepare(expressPreHandler(app, (req, res, next) => {
    console.log('(1) cookies for', req.method, req.path, ' ====> ', req.cookies);
    next();
    console.log('(2) status code for', req.method, req.path, ' ====> ', res.statusCode);
  }))
  .register(async (req) => {
    console.log('executing', req.method, req.genericPath);
    const name = req.pathParams.name;
    const salute = req.pathParams.salute;
    return {
      code: HttpStatusCode.OK_200,
      body: `${salute}, ${name}!`,
    };
  });

const greetNamePartialApi = partial(api, '/greet/:name');

register(greetNamePartialApi, 'GET /preferred-salutex/:salute', async (req) => {
  const name = req.pathParams.name;
  const salute = req.pathParams.salute;
  return {
    code: HttpStatusCode.OK_200,
    body: `${salute}, ${name}!`,
  };
});

register(api.pokemon.GET, async (req) => {
  req.pathParams
  return {
    code: HttpStatusCode.OK_200,
    body: {
      list: pokemons.slice(req.query.skip, req.query.take + req.query.skip),
      total: pokemons.length,
    },
  };
});

register(api.pokemon[':id'].GET, async (req) => {
  console.log('Headers:', req.headers);
  const pokemon = pokemons.find(p => p.id.toString() === req.pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
  }
  return { code: HttpStatusCode.OK_200, body: pokemon };
});

register(api, 'PATCH /pokemon/:id', async (req) => {
  const pokemon = pokemons.find(p => p.id.toString() === req.pathParams.id);
  if (!pokemon) {
    return { code: HttpStatusCode.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
  }
  Object.assign(pokemon, req.body);
  return { code: HttpStatusCode.NoContent_204 };
});

register(api, 'POST /pokemon', async (req) => {
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

register(route(api, 'DELETE /pokemon/:id'), async (req) => {
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