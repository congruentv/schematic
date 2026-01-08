import { 
  apiContract
} from "@congruentv/schematic";
import { v1_pokemons } from "./pokemons/v1.js";

export const pokedexApiContract = apiContract({
  api: {
    v1: {
      ...v1_pokemons.cloneDefinition()
    }
  },
  upload: {
    
  }
});