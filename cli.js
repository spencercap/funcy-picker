#!/usr/bin/env node

const inquirer = require('inquirer');
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
// const { parse } = require("path");

// start
console.log('👋');

// args
const [env, name, ...args] = process.argv;
console.log('args:', args);

const { program } = require('commander');
program.version('0.0.1');

// TEST - args
// set
program
	.option('-d, --debug', 'output extra debugging')
	.option('-s, --small', 'small pizza size')
	.option('-pi, --pizza-type <type>', 'flavour of pizza')
	.option('-p, --path <path>', 'path');
// parse
program.parse(process.argv);
// see
const options = program.opts();
if (options.debug) console.log(options);
console.log('pizza details:');
if (options.small) console.log('- small pizza size');
if (options.pizzaType) console.log(`- ${options.pizzaType}`);
if (options.path) console.log(`- ${options.path}`);
//
//
//

if (!options.path) {
	console.log('no path!');
	return;
}


const path1 = path.resolve(__dirname);
console.log('path1', path1);

// another way:
// const dirName = path.dirname(require.main.filename);
// console.log('dirName', dirName);

const pathRoot = path.resolve('./');
console.log('pathRoot:', pathRoot);

// fs.readFile(path.resolve(__dirname, 'settings.json'), 'UTF-8',
// 	(x) => {
// 		console.log('got x', x);
// 	});

// const SrcIndex = require("./examples/cf-index-built.js");
// const SrcIndex = require("./examples/funcs-index.js");

let SrcIndex = null;
try {
	SrcIndex = require(options.path);
} catch (e) {
	console.log('no index source file');
	return;
}

// const SrcIndex = require(options.path);
const exportedFuncs = Object.keys(SrcIndex);
// console.log('exportedFuncs:', exportedFuncs);

const choices = exportedFuncs.map(x => {
	return { name: x }
});
// console.log('choices', choices);

// test read from cache
try {
	// let rawdata = fs.readFileSync('./cache/last-run-with.json');
	// let rawdata = fs.readFileSync(path.resolve(__dirname, '/cache/last-run-with.json'), 'utf8');
	let rawdata = fs.readFileSync(path.resolve(__dirname, 'cache/last-run-with.json'));
	// path.resolve(__dirname, '/cache/last-run-with.json')
	// console.log('rawdata', rawdata);

	let parsed = null;
	if (rawdata) {
		parsed = JSON.parse(rawdata);
		console.log('parsed:', parsed);

		for (let [i, c] of choices.entries()) {
			// c.name
			for (let cPrev of parsed.ranWith) {
				if (c.name == cPrev) {
					// replace choice w choice selected!
					choices.splice(i, 1, {
						name: c.name,
						checked: true
					});
				}
			}
		}
	}
} catch (e) {
	// return;
	console.log('no previous call cache');
}


// fs.readFile('./cache/last-run-with.json', (err, data) => {
// 	// if (err) throw err;
// 	if (err) return;

// 	parsed = JSON.parse(data);
// 	console.log('parsed:', parsed);

// 	for (let [i, c] of choices.entries()) {
// 		// c.name
// 		for (let cPrev of parsed.ranWith) {
// 			if (c.name == cPrev) {
// 				// replace choice w choice selected!
// 				choices.splice(i, 1, {
// 					name: c.name,
// 					checked: true
// 				});
// 			}
// 		}
// 	}
// });

// console.log('choices:', choices);

inquirer
	.prompt([
		{
			type: 'checkbox',
			message: 'Select functions to deploy',
			name: 'selectedFunctions',
			choices: choices,
			validate(answer) {
				if (answer.length < 1) {
					return 'Choose at least one.';
				}
				return true;
			},
		},
	])

	/*
	This code is a CLI tool that allows you to run functions in your Firebase project.
	It uses the `firebase deploy` command and passes it arguments for which functions to run.
	The code also caches what options were used last time so they can be preselected next time.
	- generated by stenography autopilot [ 🚗👩‍✈️ ]
	*/
	.then((answers) => {
		// console.log(JSON.stringify(answers, null, '  '));

		if (answers['selectedFunctions']) {
			const funcs = answers['selectedFunctions'];
			console.log('funcs:', funcs);

			const funcsAsCommaList = funcs.join(',');
			console.log('funcsAsCommaList:', funcsAsCommaList);

			// firebase cf format:
			// $ firebase deploy --only functions:addMessage,functions:makeUppercase
			const command = `firebase deploy --only functions:${funcsAsCommaList}`;
			console.log('command:', command);

			// samples
			// exec("ls -la", (error, stdout, stderr) => {
			// exec("ls", (error, stdout, stderr) => {
			/*
			// real:
			exec(command, (error, stdout, stderr) => {
				if (error) {
					console.log(`error: ${error.message}`);
					return;
				}
				if (stderr) {
					console.log(`stderr: ${stderr}`);
					return;
				}
				console.log(`stdout: ${stdout}`);
			});
			*/

			// for (const func of answer['selectedFunctions']) {
			// 	console.log('f', func);
			// }

			// TODO write to local cache which options we used last time and pre-select those for next time

			// Creates /tmp/a/apple, regardless of whether `/tmp` and /tmp/a exist.
			// fs.mkdir('./cache', { recursive: true }, (err) => {
			fs.mkdir(path.resolve(__dirname, 'cache'), { recursive: true }, (err) => {
				if (err) throw err;
			});

			// fs.writeFile(
			// 	'./cache/last-run-with.js',
			// 	`// funcsAsCommaList: ${funcsAsCommaList}`,
			// 	function (err) {
			// 		if (err) return console.log(err);
			// 		console.log('wrote file');
			// 	}
			// );

			fs.writeFile(
				// './cache/last-run-with.json',
				path.resolve(__dirname, 'cache/last-run-with.json'),
				JSON.stringify({
					ranWith: funcs
				}),
				function (err) {
					if (err) return console.log(err);
					console.log('wrote file');
				}
			);
		}
	});

// inquirer example:
// 	.prompt([
// 		{
// 			type: 'checkbox',
// 			message: 'Select toppings',
// 			name: 'toppings',
// 			choices: [
// 				new inquirer.Separator(' = The Meats = '),
// 				{
// 					name: 'Pepperoni',
// 				},
// 				{
// 					name: 'Ham',
// 				},
// 				{
// 					name: 'Ground Meat',
// 				},
// 				{
// 					name: 'Bacon',
// 				},
// 				new inquirer.Separator(' = The Cheeses = '),
// 				{
// 					name: 'Mozzarella',
// 					checked: true,
// 				},
// 				{
// 					name: 'Cheddar',
// 				},
// 				{
// 					name: 'Parmesan',
// 				},
// 				new inquirer.Separator(' = The extras = '),
// 				{
// 					name: 'Pineapple',
// 				},
// 				{
// 					name: 'Olives',
// 					disabled: 'out of stock',
// 				},
// 				{
// 					name: 'Extra cheese',
// 				},
// 			],
// 			validate(answer) {
// 				if (answer.length < 1) {
// 					return 'You must choose at least one topping.';
// 				}

// 				return true;
// 			},
// 		},
// 	])
// 	.then((answers) => {
// 		console.log(JSON.stringify(answers, null, '  '));
// 	});

// test for steno
// <<<<<<< HEAD
// const answer = () => {
// 	const x = 'the meaning of life';
// 	console.log(x);
// };
// answer();
// =======
// /*
// This code block defines a simple function and logs a variable to the console. (spencer wrote this)
// - generated by stenography autopilot [ 🚗👩‍✈️ ]
// */
// const answer = () => {
// 	const x = 'the meaning of life';
// 	console.log(x);
// };
// answer();
// >>>>>>> steno-comment

