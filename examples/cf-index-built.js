"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld2 = exports.helloWorld = void 0;
const functions = require("firebase-functions");
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
exports.helloWorld = functions.https.onRequest((request, response) => {
	functions.logger.info("Hello logs!", { structuredData: true });
	response.send("Hello from Firebase!");
});
exports.helloWorld2 = functions.https.onRequest((request, response) => {
	functions.logger.info("Hello2 logs!", { structuredData: true });
	response.send("Hello2 from Firebase!");
});
//# sourceMappingURL=index.js.map