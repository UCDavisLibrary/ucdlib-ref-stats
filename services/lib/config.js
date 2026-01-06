class Config {
  constructor(){
    
    this.app = {
      hostPort: this.getEnv('APP_HOST_PORT', 3000),
      containerPort: this.getEnv('APP_CONTAINER_PORT', 3000),
      bundleName: this.getEnv('APP_BUNDLE_NAME', 'ucdlib-ref-stats.js'),
      loggerName: this.getEnv('APP_LOGGER_NAME', 'ucdlib-ref-stats'),
      isDevEnv: this.getEnv('APP_ENV') === 'dev',
      bundleVersion: (new Date()).toISOString()
    }
    // todo: if not dev env, read version from cork-build version file

    this.db = {
      tables: {
        picklist: 'picklist',
        picklistItem: 'picklist_item'
      },
      views: {
        picklistWithItems: 'picklist_with_items'
      }
    }
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