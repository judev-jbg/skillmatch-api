/**
 * Error HTTP con código de estado.
 * Permite lanzar errores controlados desde servicios y que el controlador
 * los capture y responda con el código adecuado.
 */
export class HttpError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
  }
}
