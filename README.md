# 🐾 PokéManager API

API RESTful para gerenciamento de Treinadores e Pokémons, desenvolvida na disciplina
**Desenvolvimento de APIs Modernas** (UFF).

> **Status atual: Entrega 2 — Persistência Relacional, Validação Zod e Integração PokéAPI.**
> Autenticação, Docker completo e CI/CD chegam nas próximas entregas.

## 🛠️ Tecnologias Utilizadas

- Node.js & TypeScript (strict mode)
- Express
- Clean Architecture (Domain, Application, Infrastructure, Main)
- PostgreSQL + Prisma ORM 7 (driver adapter `@prisma/adapter-pg`)
- Zod (validação de payloads e da resposta da PokéAPI)
- Fetch API nativa para consumo da [PokéAPI](https://pokeapi.co)
- Swagger / OpenAPI 3.0
- Frontend estático (HTML/CSS/JS puro) servido pela própria API

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

- Node.js v20+
- Docker e Docker Compose (para o PostgreSQL)

```bash
# 1. Instale as dependências (gera o Prisma Client automaticamente)
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env

# 3. Suba o PostgreSQL
docker compose up -d

# 4. Aplique as migrations e popule o catálogo
#    (o seed importa os 151 Pokémons da 1ª geração da PokéAPI; sem internet, usa 3 fixos)
npm run db:migrate
npm run db:seed

# 5. Suba a API em modo desenvolvimento
npm run dev
```

- Frontend: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`

### Outros scripts

```bash
npm run build       # prisma generate + compila para dist/
npm start           # roda a build de produção (dist/main/server.js)
npm run db:deploy   # aplica migrations em produção (sem prompts)
npm run db:studio   # Prisma Studio para inspecionar o banco
npm run lint        # ESLint
npm run lint:fix
npm run format      # Prettier
npm run typecheck   # checagem de tipos sem emitir arquivos
```

## 📚 Contrato REST

### Catálogo local (Entrega 1, agora persistido no PostgreSQL)

| Método | Rota                   | Descrição                                    |
| ------ | ---------------------- | -------------------------------------------- |
| GET    | `/api/v1/pokemons`     | Lista paginada (`?page=&limit=&name=&type=`) |
| GET    | `/api/v1/pokemons/:id` | Busca uma espécie por ID                     |
| POST   | `/api/v1/pokemons`     | Cadastra um Pokémon manualmente              |
| PUT    | `/api/v1/pokemons/:id` | Atualiza os dados de um Pokémon              |
| DELETE | `/api/v1/pokemons/:id` | Remove um Pokémon do catálogo                |

### Pokédex, Treinadores e Capturas (Entrega 2)

| Método | Rota                                   | Descrição                                            |
| ------ | -------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/v1/pokedex/search?name=pikachu`  | Consulta direto na PokéAPI e retorna o DTO formatado |
| GET    | `/api/v1/trainers`                     | Lista treinadores (usado pelo frontend)              |
| POST   | `/api/v1/trainers`                     | Cadastra um treinador (`name`, `email`)              |
| POST   | `/api/v1/trainers/:trainerId/captures` | Captura um Pokémon (`pokemonName`, `nickname?`)      |
| GET    | `/api/v1/trainers/:trainerId/team`     | Lista o time atual do treinador                      |

**Regra de negócio:** o time ativo comporta no máximo **6 Pokémons**; a 7ª captura retorna `422`.

### Destaques de implementação

- **Cache da PokéAPI (padrão Decorator):** `CachedPokeApiGateway` envolve o `PokeApiGateway` e
  implementa a mesma interface `IPokeApiGateway`. As consultas ficam salvas na tabela
  `pokedex_cache` (validade configurável em `POKEDEX_CACHE_TTL_HOURS`, padrão 7 dias). Buscas
  repetidas caem de centenas de ms para poucos ms, e Pokémons já consultados continuam
  disponíveis mesmo com a PokéAPI fora do ar. Nenhum caso de uso foi alterado, só a factory.
- **Limite de 6 à prova de concorrência:** a captura conta o time e grava em uma única transação,
  com `SELECT ... FOR UPDATE` na linha do treinador. Requisições simultâneas do mesmo treinador são
  serializadas: com 5 Pokémons no time e 5 capturas em paralelo, exatamente 1 é aceita.
- **Paginação e busca:** `GET /pokemons` retorna `{ data, page, limit, total, totalPages }`, com
  `page`/`limit` validados pelo Zod (`limit` máximo de 100) e busca parcial por nome sem
  diferenciar maiúsculas/minúsculas.

### Tratamento de erros

Todas as exceções de negócio estendem `AppError` (`src/domain/errors/`) e carregam o status HTTP.
O middleware global (`errorHandler`) converte:

| Origem                                                                      | Status |
| --------------------------------------------------------------------------- | ------ |
| `ZodError` / JSON malformado                                                | 400    |
| `PokemonNotFoundError`, `TrainerNotFoundError`, `PokedexEntryNotFoundError` | 404    |
| `TrainerEmailAlreadyInUseError`                                             | 409    |
| `TeamFullError`                                                             | 422    |
| `PokeApiUnavailableError`                                                   | 502    |

## 🏗️ Arquitetura

```text
src/
  domain/          # Entidades, interfaces de repositório e erros de domínio
  application/     # Casos de uso (regras de negócio, independentes de framework)
  infrastructure/  # Prisma (repositórios), providers/ (PokéAPI), HTTP (Express), Swagger
  main/            # Composição da aplicação (DI manual, app.ts, server.ts)
prisma/            # schema.prisma, migrations e seed
public/            # Frontend estático
```

- `IPokemonRepository`, `ITrainerRepository`, `ICaptureRepository` e `IPokeApiGateway` são
  interfaces do domínio. As implementações (`Prisma*Repository`, `PokeApiGateway`) ficam em
  `infrastructure/` e são injetadas nas factories de `main/`. Trocar o `InMemoryPokemonRepository`
  pelo `PrismaPokemonRepository` não exigiu nenhuma alteração no domínio.
- O `InMemoryPokemonRepository` foi mantido para os testes unitários da Entrega 4.

Path aliases configurados no `tsconfig.json`: `@domain/*`, `@application/*`,
`@infrastructure/*`, `@main/*`.
