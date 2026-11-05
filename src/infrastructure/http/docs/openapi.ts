export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'PokéManager API',
    version: '3.0.0',
    description:
      'PokéManager API — catálogo em PostgreSQL (Prisma), treinadores, capturas, integração com a PokéAPI e autenticação JWT com RBAC (Entrega 3).\n\n**Como autenticar:** faça `POST /auth/login`, copie o `accessToken` e clique em **Authorize**. Contas de demonstração (após `npm run db:seed`): `admin@pokemanager.dev` (ADMIN), `brock@pokemanager.dev` (GYM_LEADER) e `red@pokemanager.dev` (TRAINER), todas com a senha `pokemon123`.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Auth', description: 'Cadastro, login, renovação e encerramento de sessão' },
    { name: 'Me', description: 'Rotas do treinador autenticado (ID extraído do token JWT)' },
    { name: 'Pokemons', description: 'Catálogo local de espécies de Pokémon' },
    { name: 'Pokedex', description: 'Consulta direta à PokéAPI oficial' },
    { name: 'Trainers', description: 'Treinadores, capturas e time ativo' },
    { name: 'Stats', description: 'Estatísticas agregadas calculadas no PostgreSQL' },
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
        summary: 'Cadastra um Pokémon manualmente no catálogo local (GYM_LEADER/ADMIN)',
        security: [{ bearerAuth: [] }],
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
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
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
        summary: 'Atualiza os dados de um Pokémon do catálogo local (GYM_LEADER/ADMIN)',
        security: [{ bearerAuth: [] }],
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
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Pokemons'],
        summary: 'Remove um Pokémon do catálogo local (GYM_LEADER/ADMIN)',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Pokémon removido.' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
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
        summary: 'Lista os treinadores cadastrados (GYM_LEADER/ADMIN)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de treinadores.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Trainer' } },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Trainers'],
        summary: 'Cadastra um novo treinador (descontinuada: use POST /auth/register)',
        description:
          'Mantida por compatibilidade com a Entrega 2. Faz exatamente o mesmo que `POST /auth/register`. A resposta traz os cabeçalhos `Deprecation` e `Link: </api/v1/auth/register>; rel="successor-version"`.',
        deprecated: true,
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Treinador criado.',
            headers: {
              Deprecation: { $ref: '#/components/headers/Deprecation' },
              Link: { $ref: '#/components/headers/SuccessorLink' },
            },
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
        summary: 'Captura para o time do treinador (descontinuada: use POST /me/team/catch)',
        description:
          'Mantida por compatibilidade com a Entrega 2. Para o próprio time, `POST /me/team/catch` faz o mesmo usando o ID do token; esta rota ainda permite que um ADMIN capture para outro treinador. Regra de negócio: o time ativo comporta no máximo 6 Pokémons, com checagem atômica (transação com lock no treinador). A resposta traz os cabeçalhos `Deprecation` e `Link: </api/v1/me/team/catch>; rel="successor-version"`.',
        deprecated: true,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CaptureInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Pokémon capturado.',
            headers: {
              Deprecation: { $ref: '#/components/headers/Deprecation' },
              Link: { $ref: '#/components/headers/SuccessorLink' },
            },
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Capture' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
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
        summary: 'Time público de um treinador',
        description:
          'Pública de propósito: retorna só os Pokémons do time (sem e-mail ou outros dados do treinador), como o ranking de `/stats`. Para o próprio time, use `GET /me/team`.',
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
    '/trainers/{id}/role': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      patch: {
        tags: ['Trainers'],
        summary: 'Altera o perfil de acesso de um treinador (RBAC: GYM_LEADER/ADMIN)',
        description:
          'Ninguém altera o próprio perfil, e apenas ADMIN concede ou retira o papel ADMIN.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangeRoleInput' } },
          },
        },
        responses: {
          '200': {
            description: 'Perfil alterado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastro de treinador com senha criptografada (bcrypt)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Treinador criado (o hash da senha nunca é retornado).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica e emite o JWT (access token) e o refresh token',
        description:
          'O access token vem no JSON. O refresh token vem só no cookie `pokemanager_refresh` (httpOnly, SameSite=Strict, Secure em produção, Path=/api/v1/auth), que o JavaScript não consegue ler. Limitado a poucas tentativas com falha por IP (proteção contra força bruta). A mensagem de erro é a mesma para e-mail inexistente e senha errada.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } },
          },
        },
        responses: {
          '200': {
            description: 'Autenticado.',
            headers: { 'Set-Cookie': { $ref: '#/components/headers/RefreshTokenCookie' } },
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renova a sessão com o refresh token do cookie (rotação)',
        description:
          'Sem corpo: o refresh token é lido do cookie `pokemanager_refresh`, que o navegador envia sozinho. Devolve um novo access token e troca o cookie. O token usado é revogado; reapresentar um token já revogado encerra todas as sessões do treinador (detecção de roubo). Em caso de erro, o cookie é apagado.',
        security: [{ refreshCookie: [] }],
        responses: {
          '200': {
            description: 'Novo access token (e novo cookie).',
            headers: { 'Set-Cookie': { $ref: '#/components/headers/RefreshTokenCookie' } },
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Encerra a sessão revogando o refresh token do cookie',
        description: 'Sem corpo. Revoga o token do cookie (se houver) e apaga o cookie.',
        security: [{ refreshCookie: [] }],
        responses: {
          '204': { description: 'Sessão encerrada.' },
        },
      },
    },
    '/me': {
      get: {
        tags: ['Me'],
        summary: 'Dados do treinador autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Treinador autenticado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Trainer' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Me'],
        summary: 'Apaga a própria conta (exige a senha atual)',
        description:
          'Remove o treinador autenticado junto com as capturas e as sessões. Senhas erradas contam no mesmo limite de tentativas do login. O último ADMIN não pode apagar a própria conta.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/DeleteAccountInput' } },
          },
        },
        responses: {
          '204': { description: 'Conta apagada.' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '429': { $ref: '#/components/responses/TooManyRequests' },
        },
      },
    },
    '/me/team': {
      get: {
        tags: ['Me'],
        summary: 'Time do treinador autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Time.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/me/team/catch': {
      post: {
        tags: ['Me'],
        summary: 'Captura um Pokémon para o próprio time (ID do treinador vem do token)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CaptureInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Pokémon capturado.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Capture' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { $ref: '#/components/responses/NotFound' },
          '422': { $ref: '#/components/responses/TeamFull' },
          '502': { $ref: '#/components/responses/BadGateway' },
        },
      },
    },
    '/me/team/{captureId}': {
      parameters: [
        {
          name: 'captureId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      delete: {
        tags: ['Me'],
        summary: 'Solta um Pokémon do time (apenas o próprio dono)',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Pokémon solto.' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/stats': {
      get: {
        tags: ['Stats'],
        summary: 'Estatísticas gerais (totais, mais capturados, capturas por tipo, ranking)',
        description:
          'Calculadas com SQL de agregação (COUNT, AVG, SUM, GROUP BY, LEFT JOIN e unnest) em uma transação REPEATABLE READ, garantindo números consistentes entre si.',
        responses: {
          '200': {
            description: 'Estatísticas.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'pokemanager_refresh' },
    },
    headers: {
      Deprecation: {
        description: 'Rota descontinuada desde a data informada (RFC 9745), ex: `@1793836800`.',
        schema: { type: 'string' },
      },
      SuccessorLink: {
        description:
          'Rota que substitui esta (RFC 8288), ex: `</api/v1/auth/register>; rel="successor-version"`.',
        schema: { type: 'string' },
      },
      RefreshTokenCookie: {
        description:
          'pokemanager_refresh=<token>; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Secure (em produção)',
        schema: { type: 'string' },
      },
    },
    schemas: {
      PokemonBaseStats: {
        type: 'object',
        required: ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'],
        properties: {
          hp: { type: 'integer', minimum: 0, maximum: 255 },
          attack: { type: 'integer', minimum: 0, maximum: 255 },
          defense: { type: 'integer', minimum: 0, maximum: 255 },
          specialAttack: { type: 'integer', minimum: 0, maximum: 255 },
          specialDefense: { type: 'integer', minimum: 0, maximum: 255 },
          speed: { type: 'integer', minimum: 0, maximum: 255 },
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
          types: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 2,
            example: ['electric'],
          },
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
          role: { type: 'string', enum: ['TRAINER', 'GYM_LEADER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Ash Ketchum' },
          email: { type: 'string', format: 'email', example: 'ash@kanto.com' },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 72,
            description: 'Mínimo de 8 caracteres, com ao menos uma letra e um número.',
            example: 'pikachu123',
          },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'red@pokemanager.dev' },
          password: { type: 'string', format: 'password', example: 'pokemon123' },
        },
      },
      DeleteAccountInput: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', format: 'password', example: 'pokemon123' },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'JWT (HS256) com validade curta' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: {
            type: 'integer',
            description: 'Validade do access token, em segundos',
            example: 900,
          },
        },
      },
      LoginResponse: {
        allOf: [
          { $ref: '#/components/schemas/AuthTokens' },
          {
            type: 'object',
            properties: { trainer: { $ref: '#/components/schemas/Trainer' } },
          },
        ],
      },
      ChangeRoleInput: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', enum: ['TRAINER', 'GYM_LEADER', 'ADMIN'] } },
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
      Stats: {
        type: 'object',
        properties: {
          totals: {
            type: 'object',
            properties: {
              trainers: { type: 'integer', example: 3 },
              captures: { type: 'integer', example: 13 },
              catalogPokemons: { type: 'integer', example: 151 },
              cachedPokedexEntries: { type: 'integer', example: 8 },
              averageTeamSize: { type: 'number', example: 4.33 },
            },
          },
          mostCaptured: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pokedexNumber: { type: 'integer', example: 7 },
                name: { type: 'string', example: 'squirtle' },
                imageUrl: { type: 'string', format: 'uri' },
                timesCaptured: { type: 'integer', example: 2 },
              },
            },
          },
          capturesByType: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'water' },
                count: { type: 'integer', example: 7 },
              },
            },
          },
          topTrainers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string', example: 'Ash' },
                teamSize: { type: 'integer', example: 6 },
                totalBaseStats: { type: 'integer', example: 2301 },
              },
            },
          },
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
      Unauthorized: {
        description: 'Token ausente, inválido ou expirado (ou credenciais inválidas).',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Autenticado, mas sem permissão para esta ação.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      TooManyRequests: {
        description: 'Limite de requisições excedido (rate limiting).',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};
