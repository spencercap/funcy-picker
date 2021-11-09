#!/usr/bin/env node

// start
console.log('👋');

// args
const [env, name, ...args] = process.argv;
console.log('args:', args);

// const SrcIndex = require("./examples/cf-index-built.js");
const SrcIndex = require("./examples/index.js");
const exportedFuncs = Object.keys(SrcIndex);
// console.log('exportedFuncs:', exportedFuncs);

const inquirer = require('inquirer');
const { exec } = require("child_process");
const fs = require('fs');
// const { parse } = require("path");

const choices = exportedFuncs.map(x => {
	return { name: x }
});
// console.log('choices', choices);

// test read from cache
try {
	let rawdata = fs.readFileSync('./cache/last-run-with.json');
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
			fs.mkdir('./cache', { recursive: true }, (err) => {
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
				'./cache/last-run-with.json',
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