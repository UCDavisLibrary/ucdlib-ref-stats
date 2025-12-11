import logger from '../../../../lib/logger.js';
import { MissingResourceError } from '../../../../lib/errors.js';

function handleError(res, req, error, details) {
  logger.error('Error in request', {error, corkTraceId: req.corkTraceId});

  if ( error instanceof MissingResourceError ) {
    return res.status(404).json({ error: error.message });
  }

  res.status(500).json({
    message : error.message,
    details : details,
    stack : error.stack
  });

}

export default handleError;
