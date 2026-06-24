import { jwtDecode } from "jwt-decode";
import AccessToken from "#lib/AccessToken.js";
import config from "#lib/config.js";
import models from "#models";

export default async (req, res, next) => {

  let token, userInfo;
  const clientId = config.auth.keycloakJsClient.clientId;

  // check for access token
  if ( !req.headers.authorization ) {
    res.status(401).json({
      message: 'You must authenticate to access this resource.'
    })
    return;
  }

  // parse token
  try {
    if ( req.headers.authorization ){
      token = req.headers.authorization.replace('Bearer ', '');
      token = jwtDecode(token)
    } 
    if ( !token.iss ) throw new Error('Missing iss');
    if ( !token.jti ) throw new Error('Missing jti');
  } catch (error) {
    console.log(`Unable to parse access token: ${error.message}`);
    res.status(401).json({
      message: 'Unable to parse access token.'
    });
    return;
  }

  // check for cached token
  let cached = await models.cache.get('accessToken', token.preferred_username, config.auth.serverCacheExpiration);
  if ( cached.error ) {
    console.error('Unable to retrieve access token cache: ', cached.error);
  }
  if ( cached.res && cached.res.rowCount ) {
    cached = cached.res.rows.find(row => row.data?.token?.jti === token.jti);
    if ( cached ) {
      const cachedToken = cached.data.token;
      const tokenExpiration = new Date(cachedToken.exp * 1000);
      if ( tokenExpiration >= (new Date()).getTime() ) {
        req.auth = {
          token: new AccessToken(cached.data.token, clientId),
          userInfo: cached.data.userInfo
        }
        next();
        return;
      }
    }
  }

  // fetch userinfo with access token
  try {
    const userInfoResponse = await fetch(`${token.iss}/protocol/openid-connect/userinfo`, {headers: {'Authorization': req.headers.authorization}});
    if ( !userInfoResponse.ok ) throw new Error(`HTTP Error Response: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
    userInfo = await userInfoResponse.json();
  } catch (error) {
    res.status(403).json({
      error: true,
      message: 'Not authorized to access this resource.'
    });
    return;
  }

  // check if user has base privileges
  const accessToken = new AccessToken(token, clientId);
  if ( !accessToken.hasAccess ) {
    res.status(403).json({
      error: true,
      message: 'Not authorized to access this resource.'
    });
    return;
  }

  // set cache and pass auth to next middleware
  const setCache = await models.cache.set('accessToken', token.preferred_username, {token: token, userInfo}, config.auth.serverCacheLruSize);
  if ( setCache.error ) {
    console.error('Unable to set access token cache: ', setCache.error);
  }
  req.auth = {
    token: accessToken,
    userInfo
  }

  next();

};
