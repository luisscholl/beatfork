async function verifyJWT(req, res, next) {
  try {
    // A valid JWT is expected in the HTTP header "authorization"
    const payload = await req.app.locals.jwtVerifier.verify(
      req.header("authorization")
    );
    res.locals.authenticated = true;
    res.locals.admin =
      payload.hasOwnProperty("cognito:groups") &&
      payload["cognito:groups"].includes("admin");
    res.locals.username = payload.username;
    res.locals.userId = payload.sub;
    console.log(`user is ${res.locals.username}`);
  } catch (err) {
    res.locals.authenticated = false;
    console.log(`user couldn't be authenticated: ${err}`);
  }
  next();
}

export default verifyJWT;
