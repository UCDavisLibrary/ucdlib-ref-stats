import path from 'path';
import { fileURLToPath } from 'url';

import spaMiddleware from '@ucd-lib/spa-router-middleware';

import loaderHtml from '../html/loader.html.js';
import logger from '#lib/logger.js';
import config from '#lib/config.js';
import preloadedIcons from './icons.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @description Registers the SPA middleware and static asset serving for the client app.
 * @param {import('express').Application} app - The Express application instance
 */
export default (app) => {
  let assetsDir = path.join(__dirname, '../public');
  logger.info(`Serving static assets from ${assetsDir}`);

  const routes = ['picklist', 'field', 'form-admin', 'form', 'logout', 'reports'];
  const appTitle = 'Library Services Statistics';

  spaMiddleware({
    app,
    htmlFile : path.join(__dirname, '../html/index.html'),
    isRoot : true,
    appRoutes : routes,
    static : {
      dir : assetsDir
    },
    enable404 : false,

    getConfig : async (req, res, next) => {
      next({
        routes,
        title: appTitle,
        auth: {
          clientInit: config.auth.keycloakJsClient,
          oidcScope: config.auth.oidcScope
        },
      });
    },

    template : (req, res, next) => {
      const bundle = config.app.isDevEnv ? 
        `<script src='/js/dev/${config.app.bundleName}?v=${config.app.bundleVersion}' defer></script>` : 
        `<script src='/js/dist/${config.app.bundleName}?v=${config.app.bundleVersion}' defer></script>`;
      const siteIcon = `<link rel="icon" href="/img/site-icon.png">`;
      next({
        title: appTitle,
        bundle,
        loaderHtml,
        preloadedIcons,
        siteIcon
      });
    }
  });
};
