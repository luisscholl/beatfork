import express, { json } from "express";
import { MongoClient } from "mongodb";
import { middleware } from "express-openapi-validator";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import cors from "cors";
import verifyJWT from "./middleware/jwtVerifier.mjs";
import levels from "./routers/levels.mjs";
import "dotenv/config";

const app = express();

const appPort = 443;

const mongoClient = new MongoClient(process.env.MONGO_URI);

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: "id",
  clientId: process.env.CLIENT_ID,
});

app.use(cors());
app.use(json());
app.use(verifyJWT);
app.use(
  middleware({
    apiSpec: "./docs/openapi.yaml",
    validateRequests: {
      removeAdditional: "all",
    },
    validateResponses: false,
  })
);

app.use("/levels", levels);

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

mongoClient.connect(function (mongoConnectionError, client) {
  if (mongoConnectionError) {
    throw mongoConnectionError;
  }
  app.locals.db = client.db("beatfork");
  jwtVerifier
    .hydrate()
    .catch((err) => {
      throw err;
    })
    .then(() => {
      app.locals.jwtVerifier = jwtVerifier;
      app.listen(appPort, () => {
        console.log(`Example app listening on port ${appPort}`);
      });
    });
});
