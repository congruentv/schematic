import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createExpressRegistry } from "@congruentv/schematic-adapter-express";
import { pokedexApiContract } from "@pokedex/contract";
import { DIContainer } from "@congruentv/schematic";
import { Pokemon } from "@pokedex/contract/src/pokemons/v1.js";

class LoggerService {
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

export const app = express();
app.use(cors());
app.use(bodyParser.json());

const dicontainer = new DIContainer()
  //.register('LoggerSvc', () => new LoggerService(), 'singleton')
  .register('LoggerSvc', () => {
    const prefix = '[LOG-TEST]: ';
    return ({
      log: (msg: string) => { 
        return console.log(`${prefix}${msg}`)
      }
    } satisfies LoggerService);
  }, 'singleton')
  .register('PokemonSvc', (c) => new PokemonService(c.getLoggerSvc()), 'transient');

export const pokedexApiReg = createExpressRegistry(app, dicontainer, pokedexApiContract);