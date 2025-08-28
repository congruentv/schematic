import { expect, test, describe } from 'vitest';

import { dicontainer, pokedexApiReg } from "./setup.js";
import { setup as pokemonsV1Setup } from './pokemons/v1.js'; // the import order does not matter
import { LoggerService, PokemonService } from "./services.js";
import { createRegistry, flatListAllRegistryEntries, route } from "@congruentv/schematic";
import { pokedexApiContract } from "@pokedex/contract";

describe('My Test Suite', () => {
  pokemonsV1Setup(pokedexApiReg);

  const testContainer = dicontainer.createTestClone()
    .register('LoggerSvc', () => {
      const prefix = '[LOG-TEST]: ';
      return ({
        log: (msg: string) => { 
          return console.log(`${prefix}${msg}`)
        }
      } satisfies LoggerService);
    }, 'singleton')
    .register('PokemonSvc', (c) => new PokemonService(c.getLoggerSvc()), 'transient');
  testContainer.getLoggerSvc().log('This is a test log from the test container.');

  const testPokedexApiReg = createRegistry(testContainer, pokedexApiContract, (entry) => {
    console.log('Registering TEST route:', entry.methodEndpoint.genericPath);
  });
  
  flatListAllRegistryEntries(pokedexApiReg).forEach(entry => {
    if (!entry.handler) {
      return;
    }
    route(testPokedexApiReg, `${entry.methodEndpoint.method} ${entry.methodEndpoint.genericPath}` as any)
      .inject(entry.injection)
      .register(entry.handler);
  });

  test('first', async () => {
    const result = await testPokedexApiReg.api.v1.pokemons[":id"].GET.trigger({
      headers: {
        'Authorization': 'Bearer token',
      },
      pathParams: {
        id: '25',
      },
      query: {},
      body: {},
    });
    expect(!!result).toBe(true)
  })
});