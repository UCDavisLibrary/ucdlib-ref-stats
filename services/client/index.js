import express from 'express';

import {logReqMiddleware} from '@ucd-lib/logger';

import staticRoutes from './controllers/static.js';
import apiRoutes from './controllers/api/index.js';
import config from '#lib/config.js';
import logger from '#lib/logger.js';
import { middleware as contextMiddleware } from '#lib/context.js';
import healthRoute from './controllers/api/routes/health.js';

const app = express();
app.use(logReqMiddleware(logger));
app.use(contextMiddleware);
app.use('/api', apiRoutes);
app.use('/health', healthRoute);
staticRoutes(app);

app.listen(config.app.containerPort, () => {
  config.logSummary('Server started');
});