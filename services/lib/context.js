import {v4 as uuidV4} from "uuid";

const LOG_SIGNAL_PROPERTIES = new Set([
  'corkTraceId'
]);

const store = new Map();

class AppContext {

  constructor(obj={}) {
    this.data = {
      corkTraceId: obj.corkTraceId || uuidV4()
    }

    this.logSignal = {};

    this.update(obj);
  }

  /**
   * @description Merges properties from obj into context data, updating log signal properties as needed
   * @param {Object} obj - Key value pairs to merge into context data
   */
  update(obj={}) {
    Object.keys(obj).forEach(k => {
      this.data[k] = obj[k];
      
      if( LOG_SIGNAL_PROPERTIES.has(k) ) {
        this.logSignal[k] = obj[k];
      }
    });
  }
}

/**
 * @description Creates a new AppContext, or returns the existing one if obj is already an AppContext
 * @param {Object|AppContext} obj - Initial context data
 * @returns {AppContext}
 */
function createContext(obj={}) {
  if( obj instanceof AppContext ) {
    return obj;
  }
  return new AppContext(obj);
}

/**
 * @description Retrieves an AppContext from the store by ID, returns obj if it is already an AppContext, or creates a new one
 * @param {String|AppContext|Object} obj - Context ID, existing AppContext, or object to create a context from
 * @returns {AppContext|undefined}
 */
function getContext(obj) {
  if ( typeof context === 'string'){
    return store.get(obj);
  }
  if ( obj instanceof AppContext ) {
    return obj;
  }
  return createContext(obj);
}

/**
 * @description Express middleware that attaches an AppContext to req and res, keyed by corkTraceId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function middleware(req, res, next) {

  let context = createContext({
    corkTraceId: req.corkTraceId
  });

  req.context = context;
  res.context = context;

  store.set(req.corkTraceId, context);
  res.on('finish', () => {
    store.delete(req.corkTraceId);
  });

  next();
}

export {
  AppContext,
  createContext,
  getContext,
  middleware
};