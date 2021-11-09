# funcy-picker
pick which firebase cloud functions to deploy with a command line app

# usage

TODO

# how to CLI
1. make `cli.js`
	- include env shebang as first line: `#!/usr/bin/env node`
	- run `chmod +x cli.js` to make js file executable
2. add executable(s) to `package.json`. key = name, value = path to js:
```json
  "name": "funcy-picker",
  "version": "1.0.0",
  "bin": {
    "funcy-picker": "./cli.js"
  },
  ...
```
3. install repo's command(s) for global use:
	- ON = `npm link`
	- OFF = `npm unlink`

---
## resources
- https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e
- https://www.twilio.com/blog/how-to-build-a-cli-with-node-js (video)