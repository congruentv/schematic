import { createRegistry } from '@congruentv/schematic';
import { pokemonApiContract } from '@monorepo-example/contract';

const apiReg = createRegistry(pokemonApiContract);

const ok1 = apiReg.greet

const ok2_greetx_does_not_exists = apiReg.greetx

const ok3 = apiReg['greet']

const ok4_greetx_does_not_exists = apiReg['greetx'] // <-- GOOD: accessing a non-existing property results in a compile error

// // Test with assignment to force type check
// const testReg: string = apiReg['greetx']; // This should fail
// const shouldBeNeverReg: never = apiReg['greetx']; // This should fail if type is 'never'


