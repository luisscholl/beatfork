async function verifyJWT(req, res, next) {
  try {
    console.log(req.isAuthenticated());
    console.log(req.user);
    // A valid JWT is expected in the HTTP header "authorization"
    res.locals.authenticated = req.isAuthenticated();
    res.locals.admin = req.user?.realm_access.roles.includes('admin');
    res.locals.username = req.user?.preferred_username;
    res.locals.userId = req.user?.sub;
    if (res.locals.authenticated) {
      console.log(`User is ${res.locals.username}`);
    } else {
      console.log(`User is considered a guest.`);
    }
  } catch (err) {
    console.log(`User couldn't be authenticated: ${err}`);
  }
  next();
}

export default verifyJWT;
