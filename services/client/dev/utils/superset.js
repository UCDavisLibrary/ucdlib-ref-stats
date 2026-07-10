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
    const url = `${this.url}/dashboard/list/?filters=(certified:(label:Yes,value:!t))`;
    if ( window?.location?.hostname?.includes('localhost') ) return url;

    // If not localhost, redirect to CAS login first
    // necessary because there is currently a bug with superset's "login with cas" button where it doesn't respect the prefix/application root
    return `${this.url}/login/cas?next=${encodeURIComponent(url)}`;
  }

}

export default new Superset();