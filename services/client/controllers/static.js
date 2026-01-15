import path from 'path';
import { fileURLToPath } from 'url';

import spaMiddleware from '@ucd-lib/spa-router-middleware';

import loaderHtml from '../html/loader.html.js';
import logger from '#lib/logger.js';
import config from '#lib/config.js';
import preloadedIcons from './icons.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (app) => {
  let assetsDir = path.join(__dirname, '../public');
  logger.info(`Serving static assets from ${assetsDir}`);

  const routes = ['picklist', 'field', 'form-admin', 'form'];
  const appTitle = 'Reference Statistics';

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
        title: appTitle
      });
    },

    template : (req, res, next) => {
      const bundle = config.app.isDevEnv ? 
        `<script src='/js/dev/${config.app.bundleName}?v=${config.app.bundleVersion}'></script>` : 
        `<script src='/js/dist/${config.app.bundleName}?v=${config.app.bundleVersion}'></script>`;
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
