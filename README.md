# LEMS

## Rules

- All things shared between client and server (i.e.: interfaces) go into the `shared` directory
- You should never import anything _into_ the `shared` directory, unless it comes from the `shared` directory itself. If you need anything from any other directory, move it inside the `shared` directory first. This is done because the client and the server have two different TypeScript configurations and they must stay separate.

## Development

- [Install yarn](https://yarnpkg.com/getting-started/install)
- Run `yarn` to install packages

### Client

- `yarn dev` to start the development server
- `yarn build` to build for production
- `yarn test:unit` to start unit tests once
- `yarn test:unit --watch` to start unit tests in watch mode
- `yarn test:e2e` to start Cypress
- `yarn test` to run all tests once (Cypress tests run in headless mode)

## Guides

### Add an environment variable

- Add the environment variable to the `.env` **and** `.env.example` files. Do not use the real value in the example file (duh!)
- If the environment should be read server side, add it to the `env.ts` file, where the `env` resource is. Use Zod to point out the runtime type
