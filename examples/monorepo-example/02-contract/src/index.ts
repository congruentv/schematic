import z from "zod";
import { 
  ApiContract, 
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

export type Pokemon = z.infer<typeof PokemonSchema>;

export const CreatePokemonSchema = PokemonSchema.omit({ id: true });

export type CreatePokemon = z.infer<typeof CreatePokemonSchema>;

export const NotFoundSchema = z.object({
  userMessage: z.string(),
});

export const pokemonApiContract = new ApiContract({
  // TODO
  // foo: {
  //   bar: {
  //     baz: endpoint({ // "baz" is not a valid HTTP method and should Not Be Allowed
  //       responses: {
  //         [HttpStatusCode.OK_200]: response({ body: z.string() }),
  //       },
  //     }),
  //   }
  // },
  pokemon: {
    GET: endpoint({
      query: z.object({
        take: z.number().int().min(1).max(100).default(10),
        skip: z.number().int().min(0).default(0),
        type: PokemonSchema.shape.type.optional(),
      }),
      responses: {
        [HttpStatusCode.OK_200]: response({
          body: z.object({
            list: z.array(PokemonSchema),
            total: z.number().int(),
          })
        }),
        // TODO
        // ["This Should Not Be Allowed"]: response({ 
        //   body: z.object({
        //     list: z.array(PokemonSchema),
        //     total: z.number().int(),
        //   })
        // }),
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
      UPDATE: endpoint({
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
  }
});
