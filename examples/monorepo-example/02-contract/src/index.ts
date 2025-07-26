import z from "zod";
import { 
  ApiContract, 
  MethodEndpoint,
  MethodEndpointResponse 
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
    GET: new MethodEndpoint({
      query: z.object({
        take: z.number().int().min(1).max(100).default(10),
        skip: z.number().int().min(0).default(0),
        type: PokemonSchema.shape.type.optional(),
      }),
      responses: {
        [200]: new MethodEndpointResponse(z.object({
          list: z.array(PokemonSchema),
          total: z.number().int(),
        })),
      }
    }),
    POST: new MethodEndpoint({
      body: CreatePokemonSchema,
      responses: {
        [201]: new MethodEndpointResponse(PokemonSchema),
      }
    }),
    [':id']: {
      GET: new MethodEndpoint({
        responses: {
          [200]: new MethodEndpointResponse(PokemonSchema),
          [404]: new MethodEndpointResponse(NotFoundSchema),
        },
      }),
      DELETE: new MethodEndpoint({
        responses: {
          [204]: new MethodEndpointResponse(z.void()),
          [404]: new MethodEndpointResponse(NotFoundSchema),
        }
      }),
      UPDATE: new MethodEndpoint({
        body: PokemonSchema,
        responses: {
          [200]: new MethodEndpointResponse(PokemonSchema),
          [404]: new MethodEndpointResponse(NotFoundSchema),
        }
      }),
      PATCH: new MethodEndpoint({
        body: PokemonSchema.partial(),
        responses: {
          [200]: new MethodEndpointResponse(PokemonSchema),
          [404]: new MethodEndpointResponse(NotFoundSchema),
        }
      }),
    }
  }
});
