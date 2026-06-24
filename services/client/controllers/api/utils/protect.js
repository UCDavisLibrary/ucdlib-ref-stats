/**
 * @description Middleware to protect routes
 * @param {String} AccessTokenMethod - Method name from AccessToken class to evaluate for access
 * Usage:
 *   api.get('/foo', protect('hasAdminAccess'), async (req, res) => {});
 * @returns
 */
const protect = ( AccessTokenMethod ) => {
  return ( req, res, next ) => {
    const auth = req.auth;
    if ( !auth?.token || !AccessTokenMethod || !auth.token[AccessTokenMethod] ) {
      res.status(403).json({
        message: 'Not authorized to access this resource.'
      });
      return;
    }
    next();
  };
}

export default protect;
