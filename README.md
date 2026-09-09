# 🐾 PokéManager API

API RESTful para gerenciamento de Treinadores e Pokémons, desenvolvida na disciplina
**Desenvolvimento de APIs Modernas** (UFF).

> **Status atual: Entrega 1 — Arquitetura Limpa, Repositório In-Memory e Contrato REST.**
> Persistência real, autenticação, Docker e CI/CD chegam nas próximas entregas.

## 🛠️ Tecnologias Utilizadas

- Node.js & TypeScript (strict mode)
- Express
- Clean Architecture (Domain, Application, Infrastructure, Main)
- Zod (validação de payload)
- Swagger / OpenAPI 3.0

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

- Node.js v20+

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env

# 3. Suba a API em modo desenvolvimento
npm run dev
```

A API sobe em `http://localhost:3000` e a documentação interativa (Swagger UI) fica em
`http://localhost:3000/api/docs`.

### Outros scripts

```bash
npm run build      # compila para dist/ (resolve os path aliases com tsc-alias)
npm start          # roda a build de produção (dist/main/server.js)
npm run lint        # ESLint
npm run lint:fix
npm run format      # Prettier
npm run typecheck   # checagem de tipos sem emitir arquivos
```

## 📚 Contrato REST — Catálogo de Pokémons (Entrega 1)

| Método | Rota                     | Descrição                                    |
| ------ | ------------------------ | --------------------------------------------- |
| GET    | `/api/v1/pokemons`       | Lista Pokémons do catálogo (filtro `?type=`) |
| GET    | `/api/v1/pokemons/:id`   | Busca uma espécie por ID                      |
| POST   | `/api/v1/pokemons`       | Cadastra um Pokémon manualmente               |
| PUT    | `/api/v1/pokemons/:id`   | Atualiza os dados de um Pokémon               |
| DELETE | `/api/v1/pokemons/:id`   | Remove um Pokémon do catálogo                 |

Consulte a documentação completa (schemas, exemplos e códigos de resposta) em `/api/docs`.

## 🏗️ Arquitetura

```text
src/
  domain/          # Entidades, interfaces de repositório e erros de domínio
  application/     # Casos de uso (regras de negócio, independentes de framework)
  infrastructure/  # Implementações concretas: repositório in-memory, HTTP (Express), Swagger
  main/            # Composição da aplicação (DI manual, app.ts, server.ts)
```

Path aliases configurados no `tsconfig.json`: `@domain/*`, `@application/*`,
`@infrastructure/*`, `@main/*`.
