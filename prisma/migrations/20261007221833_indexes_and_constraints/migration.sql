-- Extensão de trigramas, usada pelo índice de busca parcial por nome.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "captures_pokedex_number_idx" ON "captures"("pokedex_number");

-- CreateIndex
CREATE INDEX "pokemons_types_gin_idx" ON "pokemons" USING GIN ("types");

-- CreateIndex
CREATE INDEX "pokemons_name_trgm_idx" ON "pokemons" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "pokemons_created_at_id_idx" ON "pokemons"("created_at", "id");

-- Restrições de integridade (CHECK). O Prisma não as representa no schema, então são
-- declaradas aqui. Espelham as validações do Zod como segunda linha de defesa:
-- mesmo um INSERT feito fora da API não consegue gravar dados inválidos.

-- Catálogo local
ALTER TABLE "pokemons"
  ADD CONSTRAINT "pokemons_name_not_blank" CHECK (length(btrim("name")) > 0),
  ADD CONSTRAINT "pokemons_types_count" CHECK (cardinality("types") BETWEEN 1 AND 2),
  ADD CONSTRAINT "pokemons_stats_range" CHECK (
    "hp" BETWEEN 0 AND 255 AND "attack" BETWEEN 0 AND 255 AND "defense" BETWEEN 0 AND 255 AND
    "special_attack" BETWEEN 0 AND 255 AND "special_defense" BETWEEN 0 AND 255 AND
    "speed" BETWEEN 0 AND 255
  );

-- Treinadores: e-mail sempre normalizado em minúsculas (garante a unicidade real).
ALTER TABLE "trainers"
  ADD CONSTRAINT "trainers_name_not_blank" CHECK (length(btrim("name")) > 0),
  ADD CONSTRAINT "trainers_email_lowercase" CHECK ("email" = lower("email"));

-- Capturas
ALTER TABLE "captures"
  ADD CONSTRAINT "captures_pokedex_number_positive" CHECK ("pokedex_number" > 0),
  ADD CONSTRAINT "captures_nickname_length" CHECK ("nickname" IS NULL OR length("nickname") BETWEEN 1 AND 30),
  ADD CONSTRAINT "captures_types_count" CHECK (cardinality("types") BETWEEN 1 AND 2),
  ADD CONSTRAINT "captures_stats_range" CHECK (
    "hp" BETWEEN 0 AND 255 AND "attack" BETWEEN 0 AND 255 AND "defense" BETWEEN 0 AND 255 AND
    "special_attack" BETWEEN 0 AND 255 AND "special_defense" BETWEEN 0 AND 255 AND
    "speed" BETWEEN 0 AND 255
  );
