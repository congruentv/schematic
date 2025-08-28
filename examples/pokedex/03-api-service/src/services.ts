import { Pokemon } from "@pokedex/contract/src/pokemons/v1.js";

export class LoggerService {
  public log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }
}

export class PokemonService {

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