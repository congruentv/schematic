import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { HttpStatusCode } from '@congruentv/schematic';
import { createFetchClient } from '@congruentv/schematic-adapter-fetch';
import { pokemonApiContract } from '@monorepo-example/contract';

const client = createFetchClient(pokemonApiContract, {
  baseUrl: 'http://localhost:3000',
  enhanceRequestInit: (reqInit) => {
    reqInit.headers = {
      'Authorization': 'Bearer ' + (localStorage.getItem('token') ?? 'dummy-token'),
      ...reqInit.headers,
    };
    return reqInit;
  },
});

function App() {
  const [count, setCount] = useState(0);
  const [pokemonName, setPokemonName] = useState('');
  useEffect(() => {
    client.pokemon.id(count).GET()
      .then(response => {
        if (response.code === HttpStatusCode.OK_200) {
          setPokemonName(response.body.name);
        } else {
          setPokemonName('Pokemon not found');
        }
      }).catch(error => {
        console.error('Error fetching Pokemon:', error);
        setPokemonName('Error fetching Pokemon');
      });
  }, [count]);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Pokemons</h1>
      <div className="card">
        <button onClick={async () => {
          setCount((c) => c + 1);
        }}>
          {count} {pokemonName}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
