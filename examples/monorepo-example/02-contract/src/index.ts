import z from "zod";
import { 
  apiContract, 
  endpoint,
  response,
  HttpStatusCode
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

export type CreatePokemon = z.output<typeof CreatePokemonSchema>;

export const NotFoundSchema = z.object({
  userMessage: z.string(),
});

export const pokemonApiContract = apiContract({
  pokemon: {
    GET: endpoint({
      query: z.object({
        take: z.union([z.number(), z.string()]) // z.input
                .transform((v) => (typeof v === "string" ? Number(v) : v))
                .pipe(z.number().min(0).max(25)) // z.output
                .default(10),
        skip: z.union([z.number(), z.string()])
                .transform((v) => (typeof v === "string" ? Number(v) : v))
                .pipe(z.number().min(0))
                .default(10),
        type: PokemonSchema.shape.type.optional(),
      }),
      responses: {
        [HttpStatusCode.OK_200]: response({
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
        [HttpStatusCode.Created_201]: response({ body: z.number().int() }),
      }
    }),
    [':id']: {
      GET: endpoint({
        responses: {
          [HttpStatusCode.OK_200]: response({ body: PokemonSchema }),
          [HttpStatusCode.NotFound_404]: response({ body: NotFoundSchema }),
        },
      }),
      DELETE: endpoint({
        responses: {
          [HttpStatusCode.NoContent_204]: response({ }),
          [HttpStatusCode.NotFound_404]: response({ body: NotFoundSchema }),
        }
      }),
      PUT: endpoint({
        body: PokemonSchema,
        responses: {
          [HttpStatusCode.OK_200]: response({ body: PokemonSchema }),
          [HttpStatusCode.NotFound_404]: response({ body: NotFoundSchema }),
        }
      }),
      PATCH: endpoint({
        body: PokemonSchema.partial(),
        responses: {
          [HttpStatusCode.NoContent_204]: response({ }),
          [HttpStatusCode.NotFound_404]: response({ body: NotFoundSchema }),
        }
      }),
    }
  },
  // foo: {
  //   bar: {
  //     baz: endpoint({ // "baz" is not a valid HTTP method and will error
  //       responses: {
  //         [HttpStatusCode.OK_200]: response({ body: z.string() }),
  //       },
  //     }),
  //     GET: {}, // "GET" is not allowed because it's value is not an endpoint
  //     POST: endpoint({
  //       body: z.object({
  //         name: z.string(),
  //       }),
  //       responses: {
  //         ["InexistantHttpResponseCode"]: response({
  //           body: z.object({
  //             list: z.array(PokemonSchema),
  //             total: z.number().int(),
  //           })
  //         }),
  //       },
  //     }),
  //   }
  // },
});
