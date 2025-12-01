import {createLogger} from '@ucd-lib/logger';
import config from './config.js';

const logger = createLogger({
  name : config.app.loggerName
});

export default logger;
