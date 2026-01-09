class ServiceUtils {

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