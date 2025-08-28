import { route, HttpStatusCode as s } from "@congruentv/schematic";
import { pokedexApiReg } from "../setup.js";



// pokedexApiReg.api.v1.pokemons[":id"].GET
route(pokedexApiReg, 'GET /api/v1/pokemons/:id')
  .inject((c) => ({
    pokemonSvc: c.getPokemonSvc()
  }))
  .register(async (req) => {
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

route(pokedexApiReg, 'PATCH /api/v1/pokemons/:id')
  .register(async (req) => {
    req.injected//.myService.foo();
    if (parseInt(req.pathParams.id, 10) < 1) {
      return { code: s.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
    }
    return { code: s.NoContent_204 };
  });

route(pokedexApiReg, 'PATCH /api/v1/pokemons/:id')
  .register(async (_req) => {
    return { code: s.NoContent_204 };
  });