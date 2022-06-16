const verifyJWT = async function (req, res, next) {
  try {
    // A valid JWT is expected in the HTTP header "authorization"
    const payload = await req.app.locals.jwtVerifier.verify(
      req.header("authorization")
    );
    res.app.locals.authenticated = true;
    res.app.locals.username = "";
    res.app.locals.username = payload["cognito:username"];
    res.app.locals.userId = payload.sub;
    console.log(`user is ${req.app.locals.username}`);
  } catch (err) {
    res.app.locals.authenticated = false;
    console.log(`user couldn't be authenticated: ${err}`);
  }
  next();
};

export default verifyJWT;
