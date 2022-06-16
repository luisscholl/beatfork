const verifyJWT = async function (req, res, next) {
  try {
    // A valid JWT is expected in the HTTP header "authorization"
    const payload = await req.app.locals.jwtVerifier.verify(req.header("authorization"))
    req.app.locals.authorized = true
    req.app.locals.username = payload['cognito:username']
    req.app.locals.userId = payload.sub
    console.log("user is " + req.app.locals.username)
  } catch (err) {
    req.app.locals.authorized = false;
    console.log("user couldn't be authenticated: " + err)
  }
  next()
}

module.exports = verifyJWT
