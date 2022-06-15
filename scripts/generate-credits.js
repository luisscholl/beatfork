import { init } from "license-checker";
import { readFileSync, writeFileSync, copyFileSync } from "fs-extra";
import syncFetch from "sync-fetch";

init(
  {
    start: "./",
  },
  (errRoot, packagesRoot) => {
    if (errRoot) {
      console.error(errRoot);
    } else {
      init(
        {
          start: "./app",
        },
        (errFrontend, packagesFrontend) => {
          if (errFrontend) {
            console.error(errFrontend);
          } else {
            let packages = [];
            for (const key of Object.keys(packagesRoot)) {
              const packageRoot = packagesRoot[key];
              packageRoot.name = key;
              packages.push(packageRoot);
            }
            for (const key of Object.keys(packagesFrontend)) {
              const packageFrontend = packagesFrontend[key];
              packageFrontend.name = key;
              packages.push(packageFrontend);
            }

            // Sort alphabetically
            packages = packages.sort((a, b) => {
              if (a.name < b.name) {
                return -1;
              }
              return a.name > b.name ? 1 : 0;
            });

            // Prepare output string
            let licenseString =
              "Software and Others Credits\n===========================\n\n";
            packages.forEach((myPackage) => {
              if (myPackage.path === "./app") return;
              licenseString += `${myPackage.name.replace(/./g, "-")}\n`;
              licenseString += `${myPackage.name}\n`;
              licenseString += `${myPackage.name.replace(/./g, "-")}\n`;
              licenseString += "\n";
              licenseString += `Repository: ${myPackage.repository}\n`;
              licenseString += "\n";
              if (myPackage.licenseFile) {
                licenseString += `${readFileSync(myPackage.licenseFile)}\n`;
              } else if (
                myPackage.repository ===
                "https://github.com/rescripts/rescripts/tree/master/packages/utilities"
              ) {
                const licenseUrl =
                  "https://raw.githubusercontent.com/harrysolovay/rescripts/master/LICENSE";
                const response = syncFetch(licenseUrl);
                if (response.status === 200) {
                  licenseString += response.text();
                  return;
                }
                if (response.status !== 404) {
                  console.error("Something went wrong.", myPackage);
                  return;
                }
              } else if (
                myPackage.repository.startsWith("https://github.com/")
              ) {
                const probablePaths = [
                  "/main/LICENSE",
                  "/master/LICENSE",
                  "/main/LICENSE.md",
                  "/master/LICENSE.md",
                  "/main/Pythonwin/License.txt",
                ];
                while (probablePaths.length > 0) {
                  const licenseUrl = `https://raw.githubusercontent.com/${myPackage.repository.substring(
                    "https://github.com/".length
                  )}${probablePaths.shift()}`;
                  const response = syncFetch(licenseUrl);
                  if (response.status === 200) {
                    licenseString += response.text();
                    return;
                  }
                  if (response.status !== 404) {
                    console.error("Something went wrong.", myPackage);
                    return;
                  }
                }
                console.error("Could not determine a license.", myPackage);
              } else {
                console.error("Could not determine a license.", myPackage);
              }
              licenseString += "\n";
            });

            // Output
            writeFileSync("./LICENSE-3RD-PARTY.txt", licenseString);
            writeFileSync("./app/public/LICENSE-3RD-PARTY.txt", licenseString);
            copyFileSync(
              "./LICENSE-SONGS.txt",
              "./app/public/LICENSE-SONGS.txt"
            );
            copyFileSync("./LICENSE.txt", "./app/public/LICENSE.txt");
          }
        }
      );
    }
  }
);
