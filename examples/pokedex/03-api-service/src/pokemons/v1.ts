import { route, HttpStatusCode as s, Container } from "@congruentv/schematic";
import { Pokemon } from "@pokedex/contract/src/pokemons/v1.js";
import { providePokedexApi } from "../provider.js";

const container = new Container();

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


container.register(LoggerService, () => {
  const prefix = '[LOG-X]: ';
  return ({
    log: (message: string) => {
      console.log(`${prefix}${message}`)
    }
  })
}, 'singleton');

// container.register(LoggerService, () => new LoggerService(), 'singleton');
container.register(PokemonService, (c) => new PokemonService(c.get(LoggerService)), 'transient');

const pokedexApiReg = providePokedexApi();

// pokedexApiReg.api.v1.pokemons[":id"].GET
route(pokedexApiReg, 'GET /api/v1/pokemons/:id')
  .inject({
    pokemonSvc: container.get(PokemonService),
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