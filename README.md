# sg

This is a rhythm game created as part of the Serious Games course at Technische Universität Darmstadt.

Its goal is to motivate people to do light exercise on a daily basis at a low cost point.

## Setting Up a Development Environment

1. Clone the repository
2. Install Docker
3. Start Docker
4. Install Node.js v16.12.0
5. ```cd app && npm install && npm i -g generate-react-cli```
6. (optional) Install ESLint and Stylelint plugin for VS Code
7. (optional) Install OpenAPI (Swagger) Editor plugin for VS Code

## Developing

Start everything:

1. (Windows) Start Docker Desktop
2. `npm start`

Start the development server to view the frontend:

```npm start```

Start the backend server for development:

1. (Windows) Start Docker Desktop
2. ```cd backend && npm start```

Start the storybook server for developing components in isolation:

```cd app && npm run storybook```

Generate scaffolding for a new component:

```cd app && generate-react component MyComponent```

If you want to view the debug view for MediaPipe, create a file called .env.local in the app folder with the following content:

```
REACT_APP_DEBUG=true
```

### Linting

If you did not install the VS Code ESLint extensions, run

```npx eslint . --fix --ext .js,.mjs,.jsx,.ts,.tsx```

for linting in .js, .jsx, .ts and .tsx files. With the extension eslint will be run automatically on save.

If you did not install the VS Code Stylelint extension, run from app

```cd app && npx stylelint src/**/*.scss --fix```

for linting in .scss files. With the extension stylelint will be run automatically on save.

## Building and Deployment

```npm run bd```

## Testing

```cd app && npm test```

## Documentation

Documentation, which does not naturally fit into a comment goes into the documentation folder.

## COPYING

All source files except files in the /app/legal folder, the /app/audio folder and the /app/src/vendors folder are licensed under the Apache License, Version 2.0. The full text of the license may be found in the LICENSE.txt file. (We plan to remove the vendor folder in the future. We are currently waiting on this pull request being approved and the corresponding npm package being updated: https://github.com/developergovindgupta/multi-range-slider-react/pull/1) See LICENSE-SONGS.txt for a list of the used songs, their licenses and attribution to their authors.

All files in the /app/legal folder are licensed under the Creative Commons Attribution-ShareAlike 4.0 International Public License. They are modified for our purposes versions of [Automattic's](https://automattic.com/) legal documents, which are available at https://github.com/Automattic/legalmattic.

For running, building and deploying the project, further dependencies are installed using the installation script. We try to list all their licenses in the LICENSE-3RD-PARTY.txt. We try to maintain compatibility with the Apache 2.0 license for all our dependencies.