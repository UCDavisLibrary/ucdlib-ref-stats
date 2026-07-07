import corkBuild from './corkBuild.js';
import logger from './logger.js';

class Config {
  constructor(){
    
    this.app = {
      hostPort: this.getEnv('APP_HOST_PORT', 3000),
      containerPort: this.getEnv('APP_CONTAINER_PORT', 3000),
      bundleName: this.getEnv('APP_BUNDLE_NAME', 'ucdlib-ref-stats.js'),
      loggerName: this.getEnv('APP_LOGGER_NAME', 'ucdlib-ref-stats'),
      isDevEnv: this.getEnv('APP_ENV') === 'dev',
      bundleVersion: (new Date()).toISOString(),
      corkBuildVersion: corkBuild.version
    }
    if ( !this.app.isDevEnv && corkBuild.tag ) {
      this.app.bundleVersion = corkBuild.tag;
    }

    this.db = {
      tables: {
        picklist: 'picklist',
        picklistItem: 'picklist_item',
        field: 'form_field',
        form: 'form',
        assignment: 'form_field_assignment',
        formEntry: 'form_entry',
        formEntryFieldValue: 'form_entry_field_value',
        users: 'users',
        groups: 'groups'
      },
      views: {
        picklistWithItems: 'picklist_with_items',
        fieldFull: 'form_field_full',
        formEntryFull: 'form_entry_full'
      }
    }

    this.auth = {
      keycloakJsClient: {
        url: this.getEnv('KEYCLOAK_URL', 'https://auth.library.ucdavis.edu'),
        realm: this.getEnv('KEYCLOAK_REALM', 'internal'),
        clientId: this.getEnv('KEYCLOAK_CLIENT_ID', 'ref-stats-client')
      },
      oidcScope: this.getEnv('KEYCLOAK_OIDC_SCOPE', 'profile ucd-ids'),
      serverCacheExpiration: this.getEnv('KEYCLOAK_SERVER_CACHE_EXPIRATION', '12 hours'),
      serverCacheLruSize: this.getEnv('KEYCLOAK_SERVER_CACHE_LRU_SIZE', 5)
    };

    this.libraryIam = {
      url: this.getEnv('UCDLIB_PERSONNEL_API_USER_URL', 'https://iam.staff.library.ucdavis.edu/json'),
      user: this.getEnv('UCDLIB_PERSONNEL_API_USER', ''),
      key: this.getEnv('UCDLIB_PERSONNEL_API_KEY', ''),
      serverCacheExpiration: this.getEnv('UCDLIB_PERSONNEL_API_CACHE_EXPIRATION', '12 hours')
    }
  }

  /**
   * @description Log a summary of certain config values. 
   */
  logSummary(msg='Config Summary') {
    const details = {
      app: {
        isDevEnv: this.app.isDevEnv,
        corkBuildVersion: this.app.corkBuildVersion,
        containerPort: this.app.containerPort
      }
    }
    logger.info(msg, details);
  }

  /**
   * @description Get an environment variable.  If the variable is not set, return the default value.
   * @param {String} name - The name of the environment variable.
   * @param {*} defaultValue - The default value to return if the environment variable is not set.
   * @param {Object} opts - Options object.
   * @param {Boolean} opts.parseJson - If true, parse the environment variable as JSON.
   * @param {Boolean} opts.errorIfMissing - Throws an error if the environment variable is not set.
   * @returns
   */
  getEnv(name, defaultValue, opts={}) {
    const { errorIfMissing=false, parseJson=false, splitString=false } = opts;
    let value = process?.env?.[name];
    if (value === undefined || value === null) {
      if (errorIfMissing && defaultValue === undefined) {
        throw new Error(`Environment variable ${name} is not set`);
      }
      return defaultValue;
    }

    if ( value?.toLowerCase?.() === 'false' ) {
      value = false;
    } else if ( value?.toLowerCase?.() === 'true' ) {
      value = true;
    }
    if ( splitString && typeof value === 'string' ) {
      value = value.split(',').map(s => s.trim());
    } else if (parseJson) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        throw new Error(`Environment variable ${name} is not valid JSON`);
      }
    }
    return value;

  }
}

export default new Config();