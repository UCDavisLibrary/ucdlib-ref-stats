class ServiceUtils {

  /**
   * @description Merge app state options (loader/error settings) with any overrides
   * @param {Object|String} options - App state options object, or a string used as the error message
   * @param {Object} overrides - Override values merged on top of options
   * @param {Object} overrides.errorSettings - Error settings overrides
   * @param {Object} overrides.loaderSettings - Loader settings overrides
   * @returns {Object} Merged app state options
   */
  getAppStateOptions(options = {}, overrides = {}){
    if ( typeof options === 'string' ) {
      options = { errorSettings: {message: options} };
    }
    if ( !options.errorSettings ) {
      options.errorSettings = {};
    }
    options.errorSettings = {
      ...options.errorSettings,
      ...(overrides.errorSettings || {})
    };

    if ( !options.loaderSettings ) {
      options.loaderSettings = {};
    }
    options.loaderSettings = {
      ...options.loaderSettings,
      ...(overrides.loaderSettings || {})
    };
    return options;
  }

}

export default new ServiceUtils();