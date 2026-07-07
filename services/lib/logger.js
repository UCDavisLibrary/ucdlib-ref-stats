import {createLogger} from '@ucd-lib/logger';

const logger = createLogger({
  name: process.env.APP_LOGGER_NAME || 'ucdlib-ref-stats'
});

export default logger;
