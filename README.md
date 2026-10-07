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

# 4. Aplique as migrations e popule o catálogo inicial
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
| GET    | `/api/v1/pokemons`     | Lista Pokémons do catálogo (filtro `?type=`) |
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
