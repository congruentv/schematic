import z from "zod";
import { 
  apiContract, 
  endpoint,
  response,
  HttpStatusCode as s
} from "@congruentv/schematic";

export const PokemonSchema = z.object({
  id: z.number().int().min(1),
  name: z.string(),
  type: z.union([
    z.literal('fire'),
    z.literal('water'),
    z.literal('grass'),
  ]),
  description: z.string().optional(),
});

export type Pokemon = z.output<typeof PokemonSchema>;

export const CreatePokemonSchema = PokemonSchema.omit({ id: true });
// const result = CreatePokemonSchema.safeParse({
//   name: "Bulbasaur",
//   type: "grassx",
//   description: "A grass-type Pokémon."
// });
// if (!result.success) {
//   const errors = z.treeifyError(result.error);  
// }

export type CreatePokemon = z.output<typeof CreatePokemonSchema>;

export const NotFoundSchema = z.object({
  userMessage: z.string(),
});

export const v1_pokemons = apiContract({
  pokemons: {
    GET: endpoint({
      query: z.object({
        take: z.union([z.number(), z.string()]) // z.input
                .transform((v) => Number(v))
                .pipe(z.number().int().min(0).max(25)) // z.output
                .default(10),
        skip: z.union([z.number(), z.string()])
                .transform((v) => Number(v))
                .pipe(z.number().int().min(0))
                .default(10),
        type: PokemonSchema.shape.type.optional(),
      }),
      responses: {
        [s.OK_200]: response({
          body: z.object({
            list: z.array(PokemonSchema),
            total: z.number().int(),
          })
        }),
      }
    }),
    POST: endpoint({
      headers: z.object({
        'x-custom-header': z.string(),
      }),
      body: CreatePokemonSchema,
      responses: {
        [s.Created_201]: response({ body: z.number().int() }),
      }
    }),
    [':id']: {
      GET: endpoint({
        responses: {
          [s.OK_200]: response({ body: PokemonSchema }),
          [s.NotFound_404]: response({ body: NotFoundSchema }),
        },
      }),
      DELETE: endpoint({
        responses: {
          [s.NoContent_204]: response({  }),
          [s.NotFound_404]: response({ body: NotFoundSchema }),
        }
      }),
      PUT: endpoint({
        body: PokemonSchema,
        responses: {
          [s.OK_200]: response({ body: PokemonSchema }),
          [s.NotFound_404]: response({ body: NotFoundSchema }),
        }
      }),
      PATCH: endpoint({
        body: PokemonSchema.partial(),
        responses: {
          [s.NoContent_204]: response({  }),
          [s.NotFound_404]: response({ body: NotFoundSchema }),
        }
      }),
    }
  },
});