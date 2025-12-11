import express from 'express';

import {logReqMiddleware} from '@ucd-lib/logger';

import staticRoutes from './controllers/static.js';
import apiRoutes from './controllers/api/index.js';
import config from '../lib/config.js';
import logger from '../lib/logger.js';

const app = express();
app.use(logReqMiddleware(logger));
app.use('/api', apiRoutes);
staticRoutes(app);

app.listen(config.app.containerPort, () => {
  const configSummary = {
    port: config.app.containerPort,
  };
  logger.info(`Server started on port ${config.app.containerPort}`, { config: configSummary });
});