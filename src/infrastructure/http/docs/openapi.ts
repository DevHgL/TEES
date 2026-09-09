export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'PokéManager API',
    version: '1.0.0',
    description:
      'Contrato REST do catálogo local de Pokémons (Entrega 1 — Arquitetura Limpa e Repositório In-Memory).',
  },
  servers: [{ url: '/api/v1' }],
  tags: [{ name: 'Pokemons', description: 'Catálogo local de espécies de Pokémon' }],
  paths: {
    '/pokemons': {
      get: {
        tags: ['Pokemons'],
        summary: 'Lista Pokémons do catálogo local',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filtra pelo tipo do Pokémon (ex: fire, water).',
          },
        ],
        responses: {
          '200': {
            description: 'Lista de Pokémons.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Pokemon' } },
              },
            },
          },
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
    },
  },
};
