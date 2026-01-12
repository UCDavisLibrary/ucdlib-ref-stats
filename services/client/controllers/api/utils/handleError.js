import logger from '#lib/logger.js';
// import { MissingResourceError } from '../../../../lib/errors.js';

function handleError(res, req, error, details) {
  logger.error('Error in request', req.context.logSignal, {error});

  // if ( error instanceof MissingResourceError ) {
  //   return res.status(404).json({ error: error.message });
  // }
  let status = 500;
  if ( error.code === 'P4040' ) {
    status = 404;
  }

  res.status(status).json({
    message : error.message,
    details : details,
    stack : error.stack
  });

}

export default handleError;
