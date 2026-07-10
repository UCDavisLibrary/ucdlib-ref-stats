class Superset {

  get url() {
    if ( !this._url ) {
      if ( window?.location?.hostname?.includes('localhost') ) {
        this._url = 'http://localhost:8088';
      } else {
        this._url = `${window?.location?.protocol}//${window?.location?.hostname}/dashboards`;
      }
    }
    return this._url;
  }

  get dashboardListUrl() {
    return `${this.url}/dashboard/list/?filters=(certified:(label:Yes,value:!t))`;
  }

}

export default new Superset();