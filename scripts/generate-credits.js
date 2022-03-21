const checker = require("license-checker");
const fs = require("fs-extra");
const syncFetch = require("sync-fetch");
const { execSync } = require("child_process");

checker.init({
  start: "./"
}, (err, packagesRoot) => {
  if (err) {
    console.error(err);
  } else {
    checker.init({
      start: "./app"
    }, (err, packagesFrontend) => {
      if (err) {
        console.error(err);
      } else {
        let packages = [];
        for (let key of Object.keys(packagesRoot)) {
          const package = packagesRoot[key];
          package.name = key;
          packages.push(package);
        }
        for (let key of Object.keys(packagesFrontend)) {
          const package = packagesFrontend[key];
          package.name = key;
          packages.push(package);
        }

        // Sort alphabetically
        packages = packages.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1: 0);

        // Prepare output string
        let licenseString = "Software and Others Credits\n===========================\n\n";
        packages.forEach(package => {
          if (package.path === "./app") return;
          licenseString += `${package.name.replace(/./g, "-")}\n`;
          licenseString += `${package.name}\n`;
          licenseString += `${package.name.replace(/./g, "-")}\n`;
          licenseString += "\n";
          licenseString += `Repository: ${package.repository}\n`;
          licenseString += "\n";
          if (package.licenseFile) {
            licenseString += `${fs.readFileSync(package.licenseFile)}\n`;
          } else if (package.repository === "https://github.com/rescripts/rescripts/tree/master/packages/utilities") {
            const licenseUrl = "https://raw.githubusercontent.com/harrysolovay/rescripts/master/LICENSE";
            const response = syncFetch(licenseUrl);
            if (response.status === 200) {
              licenseString += response.text();
              return;
            } else if (response.status !== 404) {
              console.error("Something went wrong.", package);
              return;
            }
          } else if (package.repository.startsWith("https://github.com/")) {
            const probablePaths = [ "/main/LICENSE", "/master/LICENSE", "/main/LICENSE.md", "/master/LICENSE.md", "/main/Pythonwin/License.txt" ];
            while (probablePaths.length > 0) {
              const licenseUrl = `https://raw.githubusercontent.com/${package.repository.substring("https://github.com/".length)}${probablePaths.shift()}`;
              const response = syncFetch(licenseUrl);
              if (response.status === 200) {
                licenseString += response.text();
                return;
              } else if (response.status !== 404) {
                console.error("Something went wrong.", package);
                return;
              }
            }
            console.error("Could not determine a license.", package);
          } else {
            console.error("Could not determine a license.", package);
          }
          licenseString += "\n";
        });

        // Output
        fs.writeFileSync("./LICENSE-3RD-PARTY.txt", licenseString);
        fs.writeFileSync("./app/public/LICENSE-3RD-PARTY.txt", licenseString);
        fs.copyFileSync("./LICENSE-SONGS.txt", "./app/public/LICENSE-SONGS.txt");
        fs.copyFileSync("./LICENSE.txt", "./app/public/LICENSE.txt");
      }
    });
  }
});