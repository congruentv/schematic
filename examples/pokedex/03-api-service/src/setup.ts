import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createExpressRegistry } from "@congruentv/schematic-adapter-express";
import { pokedexApiContract } from "@pokedex/contract";
import { DIContainer } from "@congruentv/schematic";
import { LoggerService, PokemonService } from "./services.js";

export const app = express();
app.use(cors());
app.use(bodyParser.json());

export const dicontainer = new DIContainer()
  .register('LoggerSvc', () => new LoggerService(), 'singleton') // here, the registration order matters, it forces the end developer to push common deps up in the chain
  .register('PokemonSvc', (c) => new PokemonService(c.getLoggerSvc()), 'transient');

export const pokedexApiReg = createExpressRegistry(app, dicontainer, pokedexApiContract);