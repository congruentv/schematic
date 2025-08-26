import { 
  apiContract, 
  HttpStatusCode as s,
  createRegistry,
  register,
  route
} from "@congruentv/schematic";
import { Pokemon, pokemonsV1ApiContract } from "./pokemons/v1.js";

export const pokedexApiContract = apiContract({
  v1: {
    ...pokemonsV1ApiContract.__DEF__
  }
});

const pokedexApiReg = createRegistry(pokedexApiContract, () => {});
// pokedexApiReg.v1.pokemons[":id"].GET
register(pokedexApiReg, 'GET /v1/pokemons/:id', async (_req) => {
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

route(pokedexApiReg, 'PATCH /v1/pokemons/:id')
  .register(async (req) => {
    if (parseInt(req.pathParams.id, 10) < 1) {
      return { code: s.NotFound_404, body: { userMessage: `Pokemon with ID ${req.pathParams.id} not found` } };
    }
    return { code: s.NoContent_204 };
  });

route(pokedexApiReg, 'PATCH /v1/pokemons/:id')
  .register(async (_req) => {
    return { code: s.NoContent_204 };
  });