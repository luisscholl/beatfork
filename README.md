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

## Developing

Start everything:

1. (Windows) Start Docker Desktop
2. `npm start`

Start the development server to view the frontend:

```cd app && npm start```

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

```npx stylelint src/**/*.scss --fix```

for linting in .scss files. With the extension stylelint will be run automatically on save.

## Building and Deployment

work-in-progress: Current steps for handing it to our tutors for grading

Run in app folder

```npm run licenses```

```npm run build```

Move license-output.md to build folder.

Copy build_README.txt to build folder.

Rename build_README.txt in build folder to README.txt

Zip build folder and upload to Moodle.

Currently there is no deployment.

## Testing

```cd app && npm test```

## Documentation

Documentation, which does not naturally fit into a comment goes into the documentation folder.