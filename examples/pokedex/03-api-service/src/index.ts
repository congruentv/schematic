import { app } from "./setup.js"; // the import order does not matter
import { pokedexApiReg } from "./setup.js";
import { setup as pokemonsV1Setup } from './pokemons/v1.js'; // the import order does not matter

// console.log('Waiting 15 secs...');
// await new Promise(resolve => setTimeout(resolve, 15000));
// console.log('Ready');

pokemonsV1Setup(pokedexApiReg);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});