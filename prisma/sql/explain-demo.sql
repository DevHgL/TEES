-- Demonstração dos índices do catálogo com EXPLAIN ANALYZE.
--
-- Com apenas 151 Pokémons o PostgreSQL prefere Seq Scan (ler a tabela inteira é mais
-- barato que consultar o índice). Este script insere 200 mil Pokémons fictícios DENTRO
-- de uma transação, compara as consultas com e sem índice e desfaz tudo no ROLLBACK.
--
-- Uso:  docker exec -i pokemanager-db psql -U pokemanager < prisma/sql/explain-demo.sql

BEGIN;

INSERT INTO pokemons (id, name, types, hp, attack, defense, special_attack, special_defense, speed, updated_at)
SELECT
  gen_random_uuid(),
  'Fake' || md5(i::text),
  ARRAY[(ARRAY['normal','fire','water','grass','electric','rock','ghost','poison'])[1 + i % 8]],
  50, 50, 50, 50, 50, 50,
  now()
FROM generate_series(1, 200000) AS i;

ANALYZE pokemons;

\echo '=================== Filtro por tipo: COM índice GIN ==================='
EXPLAIN ANALYZE SELECT * FROM pokemons WHERE types @> ARRAY['dragon'];

\echo '=================== Busca por nome: COM índice de trigramas ==================='
EXPLAIN ANALYZE SELECT * FROM pokemons WHERE name ILIKE '%saur%';

-- Desliga o uso de índices só nesta transação, para comparar.
SET LOCAL enable_indexscan = off;
SET LOCAL enable_bitmapscan = off;

\echo '=================== Filtro por tipo: SEM índice ==================='
EXPLAIN ANALYZE SELECT * FROM pokemons WHERE types @> ARRAY['dragon'];

\echo '=================== Busca por nome: SEM índice ==================='
EXPLAIN ANALYZE SELECT * FROM pokemons WHERE name ILIKE '%saur%';

ROLLBACK;
