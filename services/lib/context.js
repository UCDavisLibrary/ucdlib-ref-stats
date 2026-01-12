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

  update(obj={}) {
    Object.keys(obj).forEach(k => {
      this.data[k] = obj[k];
      
      if( LOG_SIGNAL_PROPERTIES.has(k) ) {
        this.logSignal[k] = obj[k];
      }
    });
  }
}

function createContext(obj={}) {
  if( obj instanceof AppContext ) {
    return obj;
  }
  return new AppContext(obj);
}

function getContext(obj) {
  if ( typeof context === 'string'){
    return store.get(obj);
  }
  if ( obj instanceof AppContext ) {
    return obj;
  }
  return createContext(obj);
}

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