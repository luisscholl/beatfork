// This is a script, because we need the absolute path to bind the volume.

import dotenv from "dotenv";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { exit } from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

exec(
  `docker stop keycloak & docker rm keycloak & docker run -d --rm --name keycloak -e KEYCLOAK_ADMIN=${process.env.KC_USER} -e KEYCLOAK_ADMIN_PASSWORD=${process.env.KC_PASSWORD} -p 9090:8080 -v "${__dirname}/import:/opt/keycloak/data/import" -v "${__dirname}/themes:/opt/keycloak/themes" quay.io/keycloak/keycloak:19.0.1 start-dev --import-realm --http-relative-path=auth`,
  (error, stdout, stderr) => {
    if (error) console.error(error);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  }
);

console.log("Starting Keycloak on http://localhost:9090/auth ...");
