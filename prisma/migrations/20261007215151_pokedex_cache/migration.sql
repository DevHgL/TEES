-- CreateTable
CREATE TABLE "pokedex_cache" (
    "lookup_key" TEXT NOT NULL,
    "pokedex_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "types" TEXT[],
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "special_attack" INTEGER NOT NULL,
    "special_defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "image_url" TEXT,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "cached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pokedex_cache_pkey" PRIMARY KEY ("lookup_key")
);
