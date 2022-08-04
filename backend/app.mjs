import express, { json } from "express";
import { MongoClient } from "mongodb";
import { middleware } from "express-openapi-validator";
import cors from "cors";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import passportAnonymous from "passport-anonymous";
import KeycloakBearerStrategy from "passport-keycloak-bearer";
import verifyJWT from "./middleware/jwtVerifier.mjs";
import levels from "./routers/levels.mjs";
import "dotenv/config";

const { Strategy: AnonymousStrategy } = passportAnonymous;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiSpecPath = path.join(__dirname, "docs/openapi.yaml");
const workaroundApiSpecPath = path.join(
  __dirname,
  "docs/workaroundOpenapi.yaml"
);

const app = express();

const appPort = process.env.PORT;

const mongoClient = new MongoClient(process.env.MONGO_URI);

const opts = {
  realm: process.env.REALM,
  url: process.env.URL,
};
passport.use(
  new KeycloakBearerStrategy(opts, (jwtPayload, done) => {
    console.log("____");
    console.log(jwtPayload);
    console.log("____");
    return done(null, jwtPayload);
  })
);
passport.use(new AnonymousStrategy());

app.disable("etag");
app.use(cors());
app.use(json());
app.use(passport.initialize());
app.use(
  "/",
  passport.authenticate(["keycloak", "anonymous"], { session: false })
);
app.use(verifyJWT);

// rewrite api spec to workaround problem with discerning collectibles and obstacles
const apiSpec = yaml.load(fs.readFileSync(apiSpecPath, "utf8"));
const workAroundGameObject = {
  type: "object",
  properties: {
    dimensions: {
      type: "object",
      properties: {
        x: {
          type: "number",
        },
        y: {
          type: "number",
        },
        z: {
          type: "number",
        },
      },
    },
    collectibleType: {
      type: "integer",
      minimum: 1,
      maximum: 9,
    },
    type: {
      type: "string",
      enum: ["Obstacle", "Collectible"],
    },
    position: {
      type: "object",
      properties: {
        x: {
          type: "number",
        },
        y: {
          type: "number",
        },
        z: {
          type: "number",
        },
      },
    },
    measure: {
      type: "integer",
    },
    beat: {
      type: "number",
    },
  },
};
apiSpec.paths["/levels"].post.requestBody.content[
  "application/json"
].schema.properties.versions.items.properties.objects.items = workAroundGameObject;
apiSpec.paths["/levels/{levelId}"].put.requestBody.content[
  "application/json"
].schema.properties.versions.items.properties.objects.items = workAroundGameObject;
fs.writeFileSync(workaroundApiSpecPath, JSON.stringify(apiSpec));

app.use(
  middleware({
    apiSpec: workaroundApiSpecPath,
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
  app.listen(appPort, () => {
    console.log(`Example app listening on port ${appPort}`);
  });
});
