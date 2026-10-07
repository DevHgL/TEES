import { config } from 'dotenv';

// Importado antes de qualquer outro módulo para que o .env esteja carregado quando env.ts for avaliado.
config({ quiet: true });
