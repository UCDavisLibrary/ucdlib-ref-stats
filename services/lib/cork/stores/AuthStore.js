import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';
import AccessToken from '#lib/AccessToken.js';

class AuthStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      user: new LruStore({name: 'auth.user'}),
    };

    this.token = new AccessToken();
    this.events = {
      TOKEN_REFRESHED: 'token-refreshed'
    };
  }

  setToken(token={}){
    this.token = new AccessToken(token);
    this.emit(this.events.TOKEN_REFRESHED, this.token);
  }

}

const store = new AuthStore();
export default store;
