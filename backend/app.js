const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const appPort = 443;
const mongoHost = 'mongo';
const mongoPort = '27017';
const mongoURI = 'mongodb://' + mongoHost + ':' + mongoPort;
const mongoClient = new MongoClient(mongoURI);

app.use(express.json());

app.get('/users', async (req, res) => {
  const users = await req.app.locals.db.collection('users').find().toArray();
  res.json(users);
});

app.post('/users', async (req, res) => {
  const result = await req.app.locals.db.collection('users').insertOne(req.body);
  if (result.acknowledged) {
      res.send("Success");
  } else {
      res.status(500).send("Something went wrong");
  }
});

app.get('*',function (req, res) {
    res.status(404).send('Page not found 🦗');
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
  

mongoClient.connect(function(err, client) {
  if (err) {
    throw err;
  }
  app.locals.db = client.db('beatfork');
  app.listen(appPort, () => {
    console.log(`Example app listening on port ${appPort}`);
  })
})
