# funcy-picker

a CLI app that lets you choose which firebase cloud functions to deploy.

-   works with JS or TS based cloud function codebases

![demo](./demo.gif)

# usage

TODO

TODO - make cli inline args work (currently online settings.json work)

-   default settings are:
    ...
-   these settings can be overwritten via your own `funcy-settings.json` at the root of your directory (peer to `package.json`) OR via command line arguments (which take precedence)

# how to CLI

1. make `cli.js`
    - include env shebang as first line: `#!/usr/bin/env node`
    - run `chmod +x cli.js` to make js file executable
2. add executable(s) to `package.json`. key = name, value = path to js:

```json
  "name": "funcy-picker",
  "version": "1.0.0",
  "bin": {
    "funcy-picker": "./src/cli.js"
  },
  ...
```

3. install repo's command(s) for global use:
    - ON = `npm link`
    - OFF = `npm unlink`

---

## notes

-   for dev use in a firebase functions codebase (thus requires `firebase` as a peer dependency)
-   for testing what the parts of the npm install will be run:
    `npm pack --dry-run`

## resources

-   https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e
-   https://www.twilio.com/blog/how-to-build-a-cli-with-node-js (video)
