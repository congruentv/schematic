import { route, HttpStatusCode as s } from "@congruentv/schematic";
import { Pokemon } from "@pokedex/contract/src/pokemons/v1.js";
import { providePokedexApi } from "../provider.js";

const pokedexApiReg = providePokedexApi();

// pokedexApiReg.api.v1.pokemons[":id"].GET
route(pokedexApiReg, 'GET /api/v1/pokemons/:id')
  .inject({
    myService: { 
      foo() { 
        console.log("Hello from myService.foo()"); 
      } 
    }
  })
  .register(async (req) => {
    req.injected.myService.foo();
    const pokemon: Pokemon = {
      id: 1,
      name: "Bulbasaur",
      type: "grass",
      description: "A grass-type Pokémon."
    };
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