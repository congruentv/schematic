import z from "zod";
import { 
  ApiContract, 
  HttpMethodEndpoint,
  HttpMethodEndpointResponse ,
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
  pokemon: {
    GET: new HttpMethodEndpoint({
      query: z.object({
        take: z.number().int().min(1).max(100).default(10),
        skip: z.number().int().min(0).default(0),
        type: PokemonSchema.shape.type.optional(),
      }),
      responses: {
        [HttpStatusCode.OK_200]: new HttpMethodEndpointResponse(z.object({
          list: z.array(PokemonSchema),
          total: z.number().int(),
        })),
      }
    }),
    POST: new HttpMethodEndpoint({
      body: CreatePokemonSchema,
      responses: {
        [HttpStatusCode.Created_201]: new HttpMethodEndpointResponse(PokemonSchema),
      }
    }),
    [':id']: {
      GET: new HttpMethodEndpoint({
        responses: {
          [HttpStatusCode.OK_200]: new HttpMethodEndpointResponse(PokemonSchema),
          [HttpStatusCode.NotFound_404]: new HttpMethodEndpointResponse(NotFoundSchema),
        },
      }),
      DELETE: new HttpMethodEndpoint({
        responses: {
          [HttpStatusCode.NoContent_204]: new HttpMethodEndpointResponse(z.void()),
          [HttpStatusCode.NotFound_404]: new HttpMethodEndpointResponse(NotFoundSchema),
        }
      }),
      UPDATE: new HttpMethodEndpoint({
        body: PokemonSchema,
        responses: {
          [HttpStatusCode.OK_200]: new HttpMethodEndpointResponse(PokemonSchema),
          [HttpStatusCode.NotFound_404]: new HttpMethodEndpointResponse(NotFoundSchema),
        }
      }),
      PATCH: new HttpMethodEndpoint({
        body: PokemonSchema.partial(),
        responses: {
          [HttpStatusCode.OK_200]: new HttpMethodEndpointResponse(PokemonSchema),
          [HttpStatusCode.NotFound_404]: new HttpMethodEndpointResponse(NotFoundSchema),
        }
      }),
    }
  }
});
