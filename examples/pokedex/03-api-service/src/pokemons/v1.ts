import { route, HttpStatusCode as s, DIContainer } from "@congruentv/schematic";
import { Pokemon } from "@pokedex/contract/src/pokemons/v1.js";
import { providePokedexApi } from "../provider.js";

interface ILoggerService {
  log(message: string): void;
}

class LoggerService implements ILoggerService {
  public log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }
}

interface IPokemonService {
  getPokemon(id: number): Pokemon | null;
}

class PokemonService implements IPokemonService {

  constructor(
    private readonly logger: LoggerService
  ) {}

  getPokemon(id: number): Pokemon | null {
    this.logger.log(`Fetching Pokemon with ID: ${id}`);
    return {
      id,
      name: "Bulbasaur",
      type: "grass",
      description: "A grass-type Pokémon."
    };
  }
}


// container.register(LoggerService, () => {
//   const prefix = '[LOG-X]: ';
//   return ({
//     log: (message: string) => {
//       console.log(`${prefix}${message}`)
//     }
//   })
// }, 'singleton');

const container = new DIContainer()
  .register('LoggerSvc', () => new LoggerService(), 'singleton')
  // .register('LoggerSvc', () => {
  //   const prefix = '[LOG-TEST]: ';
  //   return ({
  //     log: (msg: string) => { 
  //       return console.log(`${prefix}${msg}`)
  //     }
  //   } satisfies LoggerService);
  // }, 'singleton')
  .register('PokemonSvc', (c) => new PokemonService(c.getLoggerSvc()), 'transient');

// Create a scope for typed method access
const scope = container.createScope();

const logger = scope.getLoggerSvc();
// This should now work and logger should have the correct type
logger.log("Testing logger");

// Test that we get the right service
const pokemonService = scope.getPokemonSvc();
console.log(pokemonService.getPokemon(1));

// This line should cause a compilation error:
// const invalid = container.getInvalidService();

const pokedexApiReg = providePokedexApi();

// pokedexApiReg.api.v1.pokemons[":id"].GET
route(pokedexApiReg, 'GET /api/v1/pokemons/:id')
  .inject({
    pokemonSvc: scope.getPokemonSvc()
    //svc: PokemonService
  })
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