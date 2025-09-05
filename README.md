# schematic
Typescript schema-first tooling for modern typed REST APIs and Ops.

### Make sure that
- tsconfig.json#compilerOptions.strict is set to true

### Version bump script
- pnpm pkgs:version:bump -- [patch/minor/major/x.y.z]

### Alternatives
- https://github.com/trpc/trpc
- https://github.com/unnoq/orpc
- https://github.com/ts-rest/ts-rest
- https://github.com/ecyrbe/zodios
- https://github.com/aspida/aspida
- https://github.com/Aquila169/zod-express-middleware
- https://github.com/RobinTail/express-zod-api
- https://github.com/AngaBlue/express-zod-safe

### Interesting Articles
- https://medium.com/@nik14gos/express-js-route-validation-with-zod-26cafe5f6b3d

### TODO:
- inproc does not execute middleware handlers
- route handler: async (req, ctx: { injected, allHeaders, express: { request, response, next }, awsApiGw: ..., etc. }) => { ... }
- remove req.injected
- within trigger, validate returned object from route/middleware handler (optional setting)

### ideas:
- commands and queries => event sourcing + event replay
  - interface ICommand< TEndpointDefinition > : { map(endpDef); executeAsync(): Promise< TMapToResponses >; }
  - handleCommand(new CreatePokemonCmd())
  - handleQuery(new ListAllPokemons())