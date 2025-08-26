import { app } from "./setup.js"; // the import order does not matter
import './pokemons/v1.js'; // the import order does not matter

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});