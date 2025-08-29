import { expect, test, describe } from 'vitest';

import { dicontainer, pokedexApiReg } from "./setup.js";
import './pokemons/v1.js'; // the import order does not matter
import { LoggerService, PokemonService } from "./services.js";
import { createInProcApiClient, HttpStatusCode } from "@congruentv/schematic";
import { pokedexApiContract } from "@pokedex/contract";

describe('My Test Suite', () => {
  const testContainer = dicontainer.createTestClone()
    .register('LoggerSvc', () => {
      const prefix = '[LOG-TEST]: ';
      return ({
        log: (msg: string) => { 
          return console.log(`${prefix}${msg}`)
        }
      } satisfies LoggerService);
    }, 'singleton') // the register override order does not matter
    .register('PokemonSvc', (c) => new PokemonService(c.getLoggerSvc()), 'transient');

  const client = createInProcApiClient(pokedexApiContract, testContainer, pokedexApiReg);

  test('first', async () => {
    const result = await client.api.v1.pokemons.id('25').GET();
    expect(result.code).toBe(HttpStatusCode.OK_200);
    if (result.code === HttpStatusCode.OK_200) {
      expect(result.body).toEqual({
        id: 25,
        name: "Pikachu",
        type: "electric",
        description: "An electric-type Pokémon."
      });
    } else {
      expect.fail(`Unexpected status code: ${result.code}`);
    }
  })
});