# 🐾 PokéManager API

[![CI](https://github.com/DevHgL/TEES/actions/workflows/ci.yml/badge.svg)](https://github.com/DevHgL/TEES/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Node](https://img.shields.io/badge/Node.js-24-green)

API RESTful para gerenciamento de Treinadores e Pokémons, desenvolvida na disciplina
**Desenvolvimento de APIs Modernas** (UFF).

> **Status atual: Entrega 4 — Docker, Testes, CI/CD e Cloud Deploy.**

🔗 **URL de produção:** [https://pokemanager-api.onrender.com](https://pokemanager-api.onrender.com)
📖 **Documentação Swagger:** [https://pokemanager-api.onrender.com/api/docs](https://pokemanager-api.onrender.com/api/docs)

> Hospedada no plano gratuito do Render, que hiberna o serviço após ~15 min sem acessos. O
> workflow **Keep-alive** mantém a API acordada das 07:00 às 23:59 (horário de Brasília); de
> madrugada, a primeira requisição pode levar de 30 a 60 s.

## 🛠️ Tecnologias Utilizadas

- Node.js & TypeScript (strict mode)
- Express
- Clean Architecture (Domain, Application, Infrastructure, Main)
- PostgreSQL + Prisma ORM 7 (driver adapter `@prisma/adapter-pg`)
- Zod (validação de payloads e da resposta da PokéAPI)
- Fetch API nativa para consumo da [PokéAPI](https://pokeapi.co)
- JWT (`jsonwebtoken`) + refresh token com rotação, senhas com bcrypt (`bcryptjs`)
- Helmet, CORS e Rate Limiting (`express-rate-limit`)
- Swagger / OpenAPI 3.0
- Frontend estático (HTML/CSS/JS puro) servido pela própria API
- Vitest + Supertest (testes unitários e E2E)
- pino (logs estruturados em JSON)
- Docker (multi-stage) e Docker Compose
- GitHub Actions (CI) e Render + Neon (deploy)

## 🚀 Como Executar o Projeto Localmente

### Com Docker (recomendado)

Pré-requisito: Docker e Docker Compose.

```bash
# 1. Clone o repositório
git clone https://github.com/DevHgL/TEES.git
cd TEES

# 2. Configure as variáveis de ambiente (troque o JWT_SECRET)
cp .env.example .env

# 3. Suba banco + migrations + seed + API
docker compose up -d --build
```

O `docker compose up` sobe três serviços, em ordem:

1. `postgres` — PostgreSQL 17, com os dados no volume `pgdata`;
2. `migrate` — aplica as migrations e roda o seed (idempotente) e termina;
3. `api` — a imagem de produção, que só inicia depois que o `migrate` termina com sucesso.

- Frontend: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`
- Healthcheck: `http://localhost:3000/api/health`

### Sem Docker para a API (modo desenvolvimento)

Pré-requisito: Node.js v20+ (o banco continua no Docker).

```bash
npm install                     # gera o Prisma Client automaticamente
cp .env.example .env
docker compose up -d postgres   # só o banco
npm run db:migrate              # aplica as migrations
npm run db:seed                 # 151 Pokémons da PokéAPI (sem internet, usa 3 fixos) + contas demo
npm run dev                     # API com hot reload
```

**Contas de demonstração** (criadas pelo seed quando `SEED_DEMO_PASSWORD` está definida — não
defina essa variável em produção):

| E-mail                  | Papel      | Senha        |
| ----------------------- | ---------- | ------------ |
| `admin@pokemanager.dev` | ADMIN      | `pokemon123` |
| `brock@pokemanager.dev` | GYM_LEADER | `pokemon123` |
| `red@pokemanager.dev`   | TRAINER    | `pokemon123` |

O `.env` é validado com Zod na inicialização: se faltar uma variável obrigatória (como
`DATABASE_URL`) ou se o `JWT_SECRET` tiver menos de 32 caracteres, o servidor não sobe e mostra
o que corrigir. Para gerar um segredo:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

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
npm test            # todos os testes (unitários + E2E)
npm run test:unit   # só os unitários (não precisam de banco)
npm run test:e2e    # só os E2E (precisam do PostgreSQL rodando)
npm run test:coverage
```

## 📚 Contrato REST

Legenda de acesso: 🌐 público · 🔑 autenticado (`Authorization: Bearer <token>`) ·
🍪 cookie `pokemanager_refresh` (enviado pelo navegador) · 🛡️ apenas `GYM_LEADER`/`ADMIN`.

### Autenticação e treinador logado (Entrega 3)

| Método | Rota                         | Acesso | Descrição                                            |
| ------ | ---------------------------- | ------ | ---------------------------------------------------- |
| POST   | `/api/v1/auth/register`      | 🌐     | Cadastro com senha criptografada (bcrypt)            |
| POST   | `/api/v1/auth/login`         | 🌐     | Emite o JWT (15 min) e o cookie de refresh (7 dias)  |
| POST   | `/api/v1/auth/refresh`       | 🍪     | Novo JWT a partir do cookie, que é trocado (rotação) |
| POST   | `/api/v1/auth/logout`        | 🍪     | Revoga o refresh token e apaga o cookie              |
| GET    | `/api/v1/me`                 | 🔑     | Dados do treinador autenticado                       |
| DELETE | `/api/v1/me`                 | 🔑     | Apaga a própria conta (exige a senha atual)          |
| GET    | `/api/v1/me/team`            | 🔑     | Time do treinador autenticado                        |
| POST   | `/api/v1/me/team/catch`      | 🔑     | Captura com o ID do treinador extraído do token      |
| DELETE | `/api/v1/me/team/:captureId` | 🔑     | Solta um Pokémon (só o próprio dono)                 |
| PATCH  | `/api/v1/trainers/:id/role`  | 🛡️     | Altera o perfil de acesso (RBAC)                     |

### Catálogo local (Entrega 1, persistido no PostgreSQL)

| Método | Rota                   | Acesso | Descrição                                    |
| ------ | ---------------------- | ------ | -------------------------------------------- |
| GET    | `/api/v1/pokemons`     | 🌐     | Lista paginada (`?page=&limit=&name=&type=`) |
| GET    | `/api/v1/pokemons/:id` | 🌐     | Busca uma espécie por ID                     |
| POST   | `/api/v1/pokemons`     | 🛡️     | Cadastra um Pokémon manualmente              |
| PUT    | `/api/v1/pokemons/:id` | 🛡️     | Atualiza os dados de um Pokémon              |
| DELETE | `/api/v1/pokemons/:id` | 🛡️     | Remove um Pokémon do catálogo                |

### Pokédex, Treinadores e Capturas (Entrega 2)

| Método | Rota                                   | Acesso | Descrição                                            |
| ------ | -------------------------------------- | ------ | ---------------------------------------------------- |
| GET    | `/api/v1/pokedex/search?name=pikachu`  | 🌐     | Consulta direto na PokéAPI e retorna o DTO formatado |
| GET    | `/api/v1/trainers`                     | 🛡️     | Lista treinadores (com e-mail e perfil)              |
| POST   | `/api/v1/trainers`                     | 🌐     | Cadastra um treinador (mesmo corpo do register)      |
| POST   | `/api/v1/trainers/:trainerId/captures` | 🔑     | Captura para o próprio time (ou qualquer, se ADMIN)  |
| GET    | `/api/v1/trainers/:trainerId/team`     | 🌐     | Lista o time atual do treinador                      |
| GET    | `/api/v1/stats`                        | 🌐     | Estatísticas agregadas (totais, rankings, por tipo)  |

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

### Banco de dados: índices, restrições e estatísticas

**Índices** (além das chaves primárias, do `UNIQUE` em `trainers.email` e da FK de capturas):

| Índice                        | Tipo            | Atende                                      |
| ----------------------------- | --------------- | ------------------------------------------- |
| `pokemons_types_gin_idx`      | GIN (array)     | filtro por tipo (`types @> ARRAY[...]`)     |
| `pokemons_name_trgm_idx`      | GIN + `pg_trgm` | busca parcial por nome (`ILIKE '%...%'`)    |
| `pokemons_created_at_id_idx`  | B-tree composto | ordenação da listagem paginada              |
| `captures_trainer_id_idx`     | B-tree          | time do treinador e contagem do limite de 6 |
| `captures_pokedex_number_idx` | B-tree          | ranking de mais capturados (`GROUP BY`)     |

Com 151 Pokémons o PostgreSQL corretamente prefere `Seq Scan`. Para ver o ganho dos índices,
`prisma/sql/explain-demo.sql` insere 200 mil Pokémons fictícios numa transação, roda
`EXPLAIN ANALYZE` com e sem índice e desfaz tudo no `ROLLBACK`:

```bash
docker exec -i pokemanager-db psql -U pokemanager < prisma/sql/explain-demo.sql
```

Resultado medido: filtro por tipo **0,075 ms com índice vs 26 ms sem** (~350x); busca por nome
**0,55 ms vs 49 ms** (~90x).

**Restrições `CHECK`** (na migration `indexes_and_constraints`) espelham o Zod como segunda linha
de defesa — nem um `INSERT` feito fora da API grava dado inválido: atributos entre 0 e 255,
1 ou 2 tipos, nomes não vazios, e-mail sempre em minúsculas, apelido de até 30 caracteres e
número da Pokédex positivo.

**Estatísticas** (`GET /api/v1/stats`) são calculadas no próprio PostgreSQL com SQL de agregação
(`COUNT`, `AVG`, `SUM`, `GROUP BY`, `LEFT JOIN` e `unnest` no array de tipos), todas dentro de uma
transação `REPEATABLE READ` para que os números sejam consistentes entre si. O frontend mostra
isso na aba **Estatísticas**.

### Segurança (Entrega 3)

- **Senhas:** bcrypt com custo configurável (`BCRYPT_ROUNDS`, padrão 10). A senha exige 8 a 72
  caracteres (72 é o limite do bcrypt), com letra e número.
- **JWT:** HS256 com `issuer`, `audience` e validade de 15 minutos. Na verificação, o algoritmo é
  fixo, o que bloqueia tokens adulterados com `alg: none`.
- **Refresh token:** valor aleatório (não é JWT), guardado no banco só como hash SHA-256. Cada
  uso gera um novo e revoga o anterior; se um token já revogado for reapresentado (sinal de
  roubo), todas as sessões do treinador são encerradas.
- **Onde ficam os tokens:** o refresh token viaja **só** no cookie `pokemanager_refresh`,
  `HttpOnly` (o JavaScript não lê, então um XSS não o rouba), `SameSite=Strict` (não vai em
  requisições de outros sites, contra CSRF), `Secure` em produção e com `Path=/api/v1/auth` (só
  `/auth/refresh` e `/auth/logout` o recebem). Ele nunca aparece no JSON: se aparecesse, um
  script injetado poderia chamar `/auth/refresh` e lê-lo. O access token continua no cabeçalho
  `Authorization: Bearer`, e o frontend o guarda só em memória, nunca no `localStorage`; ao
  recarregar a página, a sessão é restaurada pelo cookie. As renovações são serializadas entre
  abas (Web Locks), para que duas abas não reapresentem o mesmo token e disparem a detecção de
  roubo.
- **Login:** a mensagem de erro é a mesma para e-mail inexistente e senha errada, e o bcrypt roda
  mesmo quando o e-mail não existe, para que o tempo de resposta não revele quem tem conta.
- **RBAC:** `ensureRole('GYM_LEADER', 'ADMIN')` protege as rotas administrativas. Na troca de
  perfil, ninguém altera o próprio papel e só `ADMIN` concede ou retira `ADMIN` — regras
  checadas no caso de uso, com o papel atual lido do banco (não do token).
- **Controle de acesso por dono:** só o dono solta um Pokémon; capturar no time de outro
  treinador pela rota `/trainers/:trainerId/captures` é proibido (exceto para `ADMIN`).
- **DTOs:** os treinadores passam pelo `toTrainerDTO` antes de virar JSON, então o hash da senha
  nunca é serializado.
- **Helmet:** CSP (só scripts da própria origem; imagens da PokéAPI liberadas), `X-Frame-Options`,
  `nosniff`, HSTS em produção, entre outros.
- **CORS:** apenas as origens em `CORS_ORIGINS` (o frontend em `/` é a mesma origem).
- **Rate limiting:** 300 requisições por IP a cada 15 minutos na API e só 5 tentativas de login
  **com falha** por IP no mesmo período (tentativas certas não contam).
- **Exclusão de conta:** `DELETE /me` exige a senha atual no corpo (um token vazado não basta), e
  senhas erradas gastam o mesmo limite de tentativas do login. Capturas e sessões são apagadas em
  cascata, e o último `ADMIN` não pode apagar a própria conta.
- **Limpeza de sessões:** a cada login/refresh, os refresh tokens expirados do treinador são
  apagados. Os revogados ainda válidos ficam, porque é com eles que o reuso é detectado.
- **Outros:** corpo JSON limitado a 10 KB, rotas inexistentes respondem 404 em JSON e o `.env` é
  validado com Zod no startup.

### Tratamento de erros

Todas as exceções de negócio estendem `AppError` (`src/domain/errors/`) e carregam o status HTTP.
O middleware global (`errorHandler`) converte:

| Origem                                                                      | Status |
| --------------------------------------------------------------------------- | ------ |
| `ZodError` / JSON malformado                                                | 400    |
| `InvalidCredentialsError`, `UnauthorizedError` (token ausente/inválido)     | 401    |
| `ForbiddenError` (papel ou dono incorreto)                                  | 403    |
| `PokemonNotFoundError`, `TrainerNotFoundError`, `PokedexEntryNotFoundError` | 404    |
| `CaptureNotFoundError`                                                      | 404    |
| `TrainerEmailAlreadyInUseError`                                             | 409    |
| `TeamFullError`                                                             | 422    |
| Rate limit excedido                                                         | 429    |
| `PokeApiUnavailableError`                                                   | 502    |

## 🧪 Testes (Entrega 4)

Vitest + Supertest, em dois projetos (`vitest.config.mts`):

- **Unitários** (`tests/unit/`): casos de uso isolados, com os repositórios in-memory
  (`InMemoryTrainerRepository`, `InMemoryCaptureRepository`, `InMemoryRefreshTokenRepository`,
  `InMemoryPokemonRepository`) e fakes da PokéAPI, do bcrypt e do JWT. Cobrem o limite de 6
  Pokémons, as regras de RBAC, soltar só pelo dono, login, rotação e reuso de refresh token e o
  CRUD do catálogo.
- **E2E** (`tests/e2e/`): requisições HTTP reais com Supertest contra a app completa e um banco
  PostgreSQL de testes (`pokemanager_test`, criado e migrado automaticamente). A PokéAPI é
  substituída por um servidor HTTP local, então os testes não dependem da internet. Cobrem
  register, login, catch, list, soltar, RBAC, refresh, rate limit, cabeçalhos de segurança e o
  CRUD do catálogo.
- **Concorrência:** um teste E2E dispara 20 capturas simultâneas com 1 vaga no time e confere que
  só 1 é aceita. Sem o `SELECT ... FOR UPDATE` o mesmo teste falha (10 são aceitas e o time vai
  a 15), então ele prova a trava, e não só o caminho feliz.

```bash
docker compose up -d postgres
npm test
```

Para usar outro banco nos E2E, defina `TEST_DATABASE_URL`. Os dados desse banco são apagados a
cada teste.

## 🐳 Docker

O `Dockerfile` tem cinco estágios:

| Estágio     | O que faz                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| `deps`      | `npm ci` com todas as dependências                                                                              |
| `build`     | gera o Prisma Client e compila o TypeScript para `dist/`                                                        |
| `migrate`   | herda do `build` e roda `prisma migrate deploy` + seed (usado pelo compose)                                     |
| `prod-deps` | só dependências de produção, sem o CLI do Prisma nem o TypeScript                                               |
| `runtime`   | imagem final: `node:24-alpine`, `dist/` + `public/`, usuário `node` (não root) e `HEALTHCHECK` em `/api/health` |

A imagem final não leva TypeScript, código-fonte nem ferramentas de build (~380 MB contra
~1,3 GB do estágio de build).

## 📋 Logs

Cada requisição gera uma linha de log em JSON (`pino-http`), com método, rota, status, tempo de
resposta e um ID de correlação. O ID vem do cabeçalho `X-Request-Id` (ou é gerado) e volta na
resposta, então um erro relatado por um cliente é encontrado direto nos logs do Render. Respostas
4xx saem como `warn`, 5xx como `error` (com a stack), e os healthchecks de `/api/health` não são
logados. O cabeçalho `Authorization` nunca vai para o log.

O nível é configurado em `LOG_LEVEL` (padrão `info`; nos testes, `silent`). Em desenvolvimento,
`npm run dev` formata a saída com `pino-pretty`.

## ⚙️ CI/CD

`.github/workflows/ci.yml` roda a cada push na `main` e em todo pull request:

1. **quality** — com um PostgreSQL como serviço: `npm ci`, ESLint, Prettier, typecheck e todos os
   testes com cobertura;
2. **docker** — build da imagem de produção, só se o job anterior passar.

`.github/workflows/keep-alive.yml` faz um ping em `/api/health` a cada 5 minutos, das 07:00 às
23:59 (horário de Brasília), para o plano gratuito do Render não hibernar a API. A madrugada fica
de fora porque 24 h por dia gastariam ~744 das 750 horas mensais gratuitas. O ping falha (e o
GitHub avisa) se a API não responder 200. Para acordá-la na hora, use **Actions → Keep-alive →
Run workflow**.

## ☁️ Deploy (Render + Neon)

O `render.yaml` descreve o serviço (Blueprint do Render):

1. Crie um banco no [Neon](https://neon.tech) e copie a connection string (com `sslmode=require`).
2. No [Render](https://render.com), **New → Blueprint** e aponte para este repositório.
3. Preencha `DATABASE_URL` com a string do Neon. O `JWT_SECRET` é gerado pelo próprio Render.

A cada deploy, o build compila a API, aplica as migrations no Neon e popula o catálogo; o Render
só troca a versão depois que `/api/health` responde. O deploy automático acontece a cada push
na `main`, depois que o CI passa.

## 🏗️ Arquitetura

```text
src/
  domain/          # Entidades, interfaces de repositório e erros de domínio
  application/     # Casos de uso, portas (IPasswordHasher, ITokenService) e serviços
  infrastructure/  # Prisma (repositórios), providers/ (PokéAPI, bcrypt, JWT), HTTP, Swagger
  main/            # Composição da aplicação (DI manual, app.ts, server.ts)
prisma/            # schema.prisma, migrations e seed
public/            # Frontend estático
tests/             # unit/ (casos de uso) e e2e/ (Supertest), com fakes em support/
```

- `IPokemonRepository`, `ITrainerRepository`, `ICaptureRepository` e `IPokeApiGateway` são
  interfaces do domínio. As implementações (`Prisma*Repository`, `PokeApiGateway`) ficam em
  `infrastructure/` e são injetadas nas factories de `main/`. Trocar o `InMemoryPokemonRepository`
  pelo `PrismaPokemonRepository` não exigiu nenhuma alteração no domínio.
- As versões in-memory dos repositórios (`InMemory*Repository`) implementam as mesmas interfaces
  e são usadas nos testes unitários da Entrega 4.

Path aliases configurados no `tsconfig.json`: `@domain/*`, `@application/*`,
`@infrastructure/*`, `@main/*`.
