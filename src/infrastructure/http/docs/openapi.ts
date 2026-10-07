export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'PokéManager API',
    version: '1.0.0',
    description:
      'PokéManager API — catálogo local persistido em PostgreSQL (Prisma), treinadores, capturas e integração com a PokéAPI (Entrega 2).',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Pokemons', description: 'Catálogo local de espécies de Pokémon' },
    { name: 'Pokedex', description: 'Consulta direta à PokéAPI oficial' },
    { name: 'Trainers', description: 'Treinadores, capturas e time ativo' },
  ],
  paths: {
    '/pokemons': {
      get: {
        tags: ['Pokemons'],
        summary: 'Lista Pokémons do catálogo local (paginado)',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtra pelo tipo do Pokémon (ex: fire, water).',
          },
          {
            name: 'name',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Busca parcial pelo nome, sem diferenciar maiúsculas/minúsculas.',
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Página de Pokémons.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PaginatedPokemons' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
      post: {
        tags: ['Pokemons'],
        summary: 'Cadastra um Pokémon manualmente no catálogo local',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreatePokemonInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Pokémon criado.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Pokemon' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/pokemons/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      get: {
        tags: ['Pokemons'],
        summary: 'Busca uma espécie pelo ID',
        responses: {
          '200': {
            description: 'Pokémon encontrado.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Pokemon' } },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Pokemons'],
        summary: 'Atualiza os dados de um Pokémon do catálogo local',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdatePokemonInput' } },
          },
        },
        responses: {
          '200': {
            description: 'Pokémon atualizado.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Pokemon' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Pokemons'],
        summary: 'Remove um Pokémon do catálogo local',
        responses: {
          '204': { description: 'Pokémon removido.' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/pokedex/search': {
      get: {
        tags: ['Pokedex'],
        summary: 'Consulta uma espécie na PokéAPI (com cache persistido no PostgreSQL)',
        parameters: [
          {
            name: 'name',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'pikachu' },
            description: 'Nome da espécie (letras, números e hífen).',
          },
        ],
        responses: {
          '200': {
            description: 'Dados oficiais da espécie.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PokedexEntry' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
          '502': { $ref: '#/components/responses/BadGateway' },
        },
      },
    },
    '/trainers': {
      get: {
        tags: ['Trainers'],
        summary: 'Lista os treinadores cadastrados',
        responses: {
          '200': {
            description: 'Lista de treinadores.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Trainer' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Trainers'],
        summary: 'Cadastra um novo treinador',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateTrainerInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Treinador criado.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Trainer' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/trainers/{trainerId}/captures': {
      parameters: [
        {
          name: 'trainerId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      post: {
        tags: ['Trainers'],
        summary: 'Captura um Pokémon (dados obtidos da PokéAPI) para o time do treinador',
        description:
          'Regra de negócio: o time ativo comporta no máximo 6 Pokémons. A checagem é atômica (transação com lock no treinador), inclusive para capturas simultâneas.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CaptureInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Pokémon capturado.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Capture' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/TeamFull' },
          '502': { $ref: '#/components/responses/BadGateway' },
        },
      },
    },
    '/trainers/{trainerId}/team': {
      parameters: [
        {
          name: 'trainerId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      get: {
        tags: ['Trainers'],
        summary: 'Lista o time atual do treinador',
        responses: {
          '200': {
            description: 'Time do treinador.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  components: {
    schemas: {
      PokemonBaseStats: {
        type: 'object',
        required: ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'],
        properties: {
          hp: { type: 'integer', minimum: 0 },
          attack: { type: 'integer', minimum: 0 },
          defense: { type: 'integer', minimum: 0 },
          specialAttack: { type: 'integer', minimum: 0 },
          specialDefense: { type: 'integer', minimum: 0 },
          speed: { type: 'integer', minimum: 0 },
        },
      },
      Pokemon: {
        type: 'object',
        required: ['id', 'name', 'types', 'baseStats'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Pikachu' },
          types: { type: 'array', items: { type: 'string' }, example: ['electric'] },
          baseStats: { $ref: '#/components/schemas/PokemonBaseStats' },
          imageUrl: { type: 'string', format: 'uri', nullable: true },
        },
      },
      PaginatedPokemons: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Pokemon' } },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 3 },
          totalPages: { type: 'integer', example: 1 },
        },
      },
      CreatePokemonInput: {
        type: 'object',
        required: ['name', 'types', 'baseStats'],
        properties: {
          name: { type: 'string', example: 'Pikachu' },
          types: { type: 'array', items: { type: 'string' }, example: ['electric'] },
          baseStats: { $ref: '#/components/schemas/PokemonBaseStats' },
          imageUrl: { type: 'string', format: 'uri' },
        },
      },
      UpdatePokemonInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          types: { type: 'array', items: { type: 'string' } },
          baseStats: { $ref: '#/components/schemas/PokemonBaseStats' },
          imageUrl: { type: 'string', format: 'uri' },
        },
      },
      PokedexEntry: {
        type: 'object',
        properties: {
          pokedexNumber: { type: 'integer', example: 25 },
          name: { type: 'string', example: 'pikachu' },
          types: { type: 'array', items: { type: 'string' }, example: ['electric'] },
          baseStats: { $ref: '#/components/schemas/PokemonBaseStats' },
          imageUrl: { type: 'string', format: 'uri' },
          height: { type: 'number', description: 'Altura em metros', example: 0.4 },
          weight: { type: 'number', description: 'Peso em kg', example: 6 },
        },
      },
      Trainer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Ash Ketchum' },
          email: { type: 'string', format: 'email', example: 'ash@kanto.com' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTrainerInput: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', example: 'Ash Ketchum' },
          email: { type: 'string', format: 'email', example: 'ash@kanto.com' },
        },
      },
      CaptureInput: {
        type: 'object',
        required: ['pokemonName'],
        properties: {
          pokemonName: { type: 'string', example: 'pikachu' },
          nickname: { type: 'string', example: 'Pika' },
        },
      },
      Capture: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          trainerId: { type: 'string', format: 'uuid' },
          pokedexNumber: { type: 'integer', example: 25 },
          name: { type: 'string', example: 'pikachu' },
          nickname: { type: 'string', example: 'Pika' },
          types: { type: 'array', items: { type: 'string' } },
          baseStats: { $ref: '#/components/schemas/PokemonBaseStats' },
          imageUrl: { type: 'string', format: 'uri' },
          capturedAt: { type: 'string', format: 'date-time' },
        },
      },
      Team: {
        type: 'object',
        properties: {
          trainerId: { type: 'string', format: 'uuid' },
          size: { type: 'integer', example: 2 },
          maxSize: { type: 'integer', example: 6 },
          pokemons: { type: 'array', items: { $ref: '#/components/schemas/Capture' } },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    responses: {
      NotFound: {
        description: 'Recurso não encontrado.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Payload inválido.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Conflito com um recurso existente.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      TeamFull: {
        description: 'Time ativo já possui 6 Pokémons.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      BadGateway: {
        description: 'PokéAPI indisponível.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};
