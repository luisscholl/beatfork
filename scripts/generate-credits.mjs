import { init } from "license-checker";
import fs from "fs-extra";
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
            init(
              {
                start: "./backend",
              },
              (errBackend, packagesBackend) => {
                if (errBackend) {
                  console.error(errBackend);
                } else {
                  let packages = [
                    {
                      name: "Legalmattic",
                      repository: "https://github.com/Automattic/legalmattic",
                    },
                  ];
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
                  for (const key of Object.keys(packagesBackend)) {
                    const packageBackend = packagesBackend[key];
                    packageBackend.name = key;
                    packages.push(packageBackend);
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
                    if (myPackage.path === "./backend") return;
                    licenseString += `${myPackage.name.replace(/./g, "-")}\n`;
                    licenseString += `${myPackage.name}\n`;
                    licenseString += `${myPackage.name.replace(/./g, "-")}\n`;
                    licenseString += "\n";
                    licenseString += `Repository: ${myPackage.repository}\n`;
                    licenseString += "\n";
                    if (myPackage.licenseFile) {
                      licenseString += `${fs.readFileSync(
                        myPackage.licenseFile
                      )}\n`;
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
                        "/master/LICENSE.txt",
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
                      console.error(
                        "Could not determine a license.",
                        myPackage
                      );
                    } else {
                      console.error(
                        "Could not determine a license.",
                        myPackage
                      );
                    }
                    licenseString += "\n";
                  });

                  // Output
                  fs.writeFileSync("./LICENSE-3RD-PARTY.txt", licenseString);
                  fs.writeFileSync(
                    "./app/public/LICENSE-3RD-PARTY.txt",
                    licenseString
                  );
                  fs.copyFileSync(
                    "./LICENSE-SONGS.txt",
                    "./app/public/LICENSE-SONGS.txt"
                  );
                  fs.copyFileSync("./LICENSE.txt", "./app/public/LICENSE.txt");
                }
              }
            );
          }
        }
      );
    }
  }
);
