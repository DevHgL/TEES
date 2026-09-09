import { createApp } from '@main/app';
import { env } from '@main/config/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`PokéManager API rodando em http://localhost:${env.port}`);
  console.log(`Documentação Swagger disponível em http://localhost:${env.port}/api/docs`);
});
