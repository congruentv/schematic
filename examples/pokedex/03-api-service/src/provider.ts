import { createRegistry } from "@congruentv/schematic";
import { pokedexApiReg } from "./setup.js";
import { pokedexApiContract } from "@pokedex/contract";

const fakePokedexApi = createRegistry(pokedexApiContract, () => {});

export function providePokedexApi() {
  if (process.env.XX === 'unit-test') {
    return fakePokedexApi;
  }
  return pokedexApiReg;
}
