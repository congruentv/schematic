import { route, middleware, HttpStatusCode as s } from "@congruentv/schematic";
import { pokedexApiReg as reg } from "../setup.js";
import { BaseRequestBodySchema, BaseRequestHeadersSchema } from "@pokedex/contract/src/pokemons/v1.js";

// const mdlw = middleware(reg, '/api/v1/pokemons/:id');

// mdlw

middleware(reg, '/api/v1/pokemons') // /:id
  .inject((c) => ({
    loggerSvc: c.getLoggerSvc()
  }))
  .register({
    headers: BaseRequestHeadersSchema,
    body: BaseRequestBodySchema.optional()
  }, async (req, next) => {
    req.injected.loggerSvc.log(`tenant id from header = ${req.headers['x-tenant-id']}`);
    //return { code: s.OK_200, body: 'halted' };
    //req.pathParams.id;
    if (req.body) {
      console.log('tenant id', req.body.tenantId);
    } else {
      console.log('No body provided');
    }
    console.log('Middleware triggered for Pokemons API');
    next();
  });

route(reg, 'GET /api/v1/pokemons/:id')
  .inject((c) => ({
    pokemonSvc: c.getPokemonSvc()
  }))
  .register(async (req) => {
    console.log(`tenant id from x-tenant-id header = `, req.headers["x-tenant-id"]);
    // console.log('Fetching Pokemon...')
    const pokemon = req.injected.pokemonSvc.getPokemon(parseInt(req.pathParams.id, 10));
    if (!pokemon) {
      return { code: s.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
    }
    // const pokemon: Pokemon = {
    //   id: 1,
    //   name: "Bulbasaur",
    //   type: "grass",
    //   description: "A grass-type Pokémon."
    // };
    return {
      code: s.OK_200,
      body: pokemon
    };
  });

// reg._middlewareRegistry
  
route(reg, 'POST /api/v1/pokemons')
  .register(async (req) => {
    // TODO: typesafe req.headers, now is :Record<string, string>
    console.log('ROUTE HANDLER: tenant id from x-tenant-id header = ', req.headers['x-tenant-id']);
    req.body.tenantId
    return {
      code: s.Created_201,
      body: 999
    };
  });

// route(reg, 'PATCH /api/v1/pokemons/:id')
//   .register(async (req) => {
//     req.injected//.myService.foo();
//     if (parseInt(req.pathParams.id, 10) < 1) {
//       return { code: s.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
//     }
//     return { code: s.NoContent_204 };
//   });

// route(reg, 'PATCH /api/v1/pokemons/:id')
//   .register(async (_req) => {
//     return { code: s.NoContent_204 };
//   });

