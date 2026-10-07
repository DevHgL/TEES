/**
 * Erro base da aplicação. Toda exceção de negócio estende esta classe e informa o
 * status HTTP correspondente, que é traduzido pelo middleware global de erros.
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
