import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createExpressRegistry } from "@congruentv/schematic-adapter-express";
import { pokedexApiContract } from "@pokedex/contract";

export const app = express();
app.use(cors());
app.use(bodyParser.json());

export const pokedexApiReg = createExpressRegistry(app, pokedexApiContract);