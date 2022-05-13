const express = require('express')
const { MongoClient } = require('mongodb')

const app = express()
const levels = require('./routers/levels')
const appPort = 443

const mongoHost = 'mongo'
const mongoPort = '27017'
const mongoURI = 'mongodb://' + mongoHost + ':' + mongoPort
const mongoClient = new MongoClient(mongoURI)

app.use(express.json())
router.use(
  OpernApiValidator.middleware({
    apiSpec: './docs/openapi.yaml',
    validateRequests: true,
    validateResponses: false,
  })
)

app.use('levels', levels)

app.get('*',function (req, res) {
    res.status(404).send('Page not found 🦗')
})

app.use(function(err, req, res, next) {
    console.error(err.stack)
    res.status(err.status || 500).json({
      message: err.message,
      errors: err.errors
    })
})
  

mongoClient.connect(function(err, client) {
  if (err) {
    throw err
  }
  app.locals.db = client.db('beatfork')
  app.listen(appPort, () => {
    console.log(`Example app listening on port ${appPort}`)
  })
})
