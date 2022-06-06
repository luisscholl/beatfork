const express = require('express')
const { MongoClient } = require('mongodb')
const OpenApiValidator = require('express-openapi-validator')
const { CognitoJwtVerifier } = require("aws-jwt-verify")
const verifyJWT = require('./middleware/jwtVerifier')
const cors = require('cors')

const app = express()
const levels = require('./routers/levels')
const appPort = 443

const mongoClient = new MongoClient(process.env.MONGO_URI)

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "id",
  clientId: process.env.CLIENT_ID
});

app.use(cors())
app.use(express.json())
app.use(verifyJWT)
app.use(
  OpenApiValidator.middleware({
    apiSpec: './docs/openapi.yaml',
    validateRequests: {
      removeAdditional: "all",
    },
    validateResponses: false,
  })
)

app.use('/levels', levels)

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors
  })
})

mongoClient.connect(function (err, client) {
  if (err) {
    throw err
  }
  app.locals.db = client.db('beatfork')
  jwtVerifier.hydrate()
    .catch((err) => {
      throw err
    })
    .then(() => {
      app.locals.jwtVerifier = jwtVerifier
      app.listen(appPort, () => {
        console.log(`Example app listening on port ${appPort}`)
      })
    })
})
