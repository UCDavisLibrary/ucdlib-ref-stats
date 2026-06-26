import logger from '#lib/logger.js';
import { AuthorizationError } from '#lib/errors.js';

/**
 * @description Sends a JSON error response. Maps known error codes to HTTP status codes.
 * @param {import('express').Response} res - The Express response object
 * @param {import('express').Request} req - The Express request object
 * @param {Error} error - The error that was thrown
 * @param {*} [details] - Optional additional details to include in the response
 */
function handleError(res, req, error, details) {
  logger.error('Error in request', req.context.logSignal, {error});

  let status = 500;
  if ( error.code === 'P4040' ) {
    status = 404;
  }

  if ( error instanceof AuthorizationError ) {
    status = 403;
  }

  res.status(status).json({
    message : error.message,
    details : details,
    stack : error.stack
  });

}

export default handleError;
