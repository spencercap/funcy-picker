#!/usr/bin/env node

// imports
const { exec } = require("child_process");
const path = require('path');
const fs = require('fs');

// cli help:
const inquirer = require('inquirer');
const { program } = require('commander');
// import { program } from 'commander'; // the .ts way

// example export funcs for dev
exports.bewm1 = () => {
	console.log('bewm1 log');
}
exports.bewm2 = () => {
	console.log('bewm2 log');
}

// welcome
// console.log('👋');

//
// root paths
const packageRootPath = path.resolve(__dirname, '../'); // stores cache (aka ranWith)
const projectRootPath = path.resolve('./'); // stores default override settings

//
// read PACKAGE package.json (this package, funcy-picker)
const packageJson = require(path.resolve(packageRootPath, 'package.json'));
const packageVersion = packageJson.version;
// console.log('packageVersion', packageVersion);
program.version(packageVersion); // FYI set version BEFORE options/args

//
// default settings
const settingsDefaultJson = require(path.resolve(packageRootPath, 'src/settingsDefault.json'));
// console.log('settingsDefaultJson', settingsDefaultJson);
const validSettings = Object.keys(settingsDefaultJson);

// 1. start w default settings
const settings = settingsDefaultJson;

//
// inline settings
program
	.option('-d, --debug', 'debug mode on')
	.option('-s, --settings-path <path>', 'user settings path (default: ./funcy-settings.json)') // relative to project
	.option('-p, --index-path <path>', 'functions\' index.js path')
	// TODO add
	// 		- cache dir ("cache/")
	// 		-
	.option('-b, --build-prj <buildPrj>', 'build project before parse (yes)'); // defaults to YES build the project's function IF its written in TS, otherwise just read the .js
// parse args
program.parse(process.argv);
const options = program.opts();

//
// user settings
let settingsUser = null;
try {
	// use provide inline settings.json path OR the usual name + place
	const userSettingsPath = path.resolve(projectRootPath, options.settingsPath || 'funcy-settings.json');
	// console.log('userSettingsPath', userSettingsPath);
	settingsUser = require(userSettingsPath);
} catch (e) {
	// console.log('no user settings...');
	// its ok, use default or inline settings
}

//
// 2. override w user settings
if (settingsUser) {
	// console.log('user settings:', settingsUser);
	for (let [sKey, sVal] of Object.entries(settingsUser)) {
		// exclude commands we dont know / care about (easy hack)
		if (validSettings.includes(sKey)) {
			settings[sKey] = sVal;
		}
	}
}

//
// 3. override w inline arg settings
for (let [sKey, sVal] of Object.entries(options)) {
	// exclude commands we dont know / care about (like --help, -V, or hacks) (easy hack)
	if (validSettings.includes(sKey)) {
		settings[sKey] = sVal;
	}
}
// end of settings config
// console.log('FINAL settings:', settings);

//
// read PROJECT package.json (for main ouput index.js path)
const projectJson = require(path.resolve(projectRootPath, 'package.json'));

//
let projectType = settings.projectType; // auto | js | ts
if (projectType == 'auto') {
	// automatically find if project is TS or JS
	let inferredProjectType = 'js';
	if ('devDependencies' in projectJson) {
		// console.log('projectJson.devDependencies', projectJson.devDependencies);
		if ('typescript' in projectJson.devDependencies) {
			inferredProjectType = 'ts';
		}
	}
	// console.log('inferredProjectType:', inferredProjectType);
	projectType = inferredProjectType;
} else if (projectType !== 'js' || projectType !== 'ts') {
	console.log('invalid projectType');
	return;
}
// console.log('projectType:', projectType);

//
// build ts to js if necessary
if (projectType == 'ts') {
	if (settings.tsBuild) {
		console.log('build ts -> js');

		const buildCommand = `npm run ${settings.tsBuildScriptName}`;
		exec(buildCommand, (error, stdout, stderr) => {
			if (error) {
				console.log(`error: ${error.message}`);
				return;
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
				return;
			}
			// console.log(`stdout: ${stdout}`);
		}).stdout.pipe(process.stdout); // prints logs of exec call
	}
}

//
// get index js path
let indexJsPath = settings.indexPath; // 'auto' | some path relative to project root
if (indexJsPath == 'auto') {
	// tries to find path to js file auto-magically via project's package.json > main field value

	if ('main' in projectJson) {
		let projectMainJsPath = projectJson.main;
		// console.log('projectMainJsPath', projectMainJsPath);
		if (projectMainJsPath.substring(0, 2) == '..') {
			throw 'what are you doing building to outside your root directory?';
		} else if (projectMainJsPath.substring(0, 1) == '.') {
			// handle "./file.js" OR "file.js"
			// lop off relative "." for path resolve use
			projectMainJsPath = projectMainJsPath.substring(1);
		}

		if (projectMainJsPath.substring(0, 1) == '/') {
			projectMainJsPath = projectMainJsPath.substring(1);
		}
		// now projectMainJsPath must look something like: "file.js" | "folder/folder/file.js"

		// auto got:
		// console.log('projectMainJsPath', projectMainJsPath);
		indexJsPath = projectMainJsPath;
	} else {
		throw 'couldnt find indexPath automatically...';
	}
}

//
// read built/final functions index.js
let indexJs = null;
try {
	indexJsPath = path.resolve(projectRootPath, indexJsPath);
	// console.log('indexJsPath:', indexJsPath);
	indexJs = require(indexJsPath);
} catch (e) {
	throw 'couldnt find indexJs (file w cloud functions in js)'
}


if (options.debug) {
	console.log('~~~ hello (de)bugger ~~~');
	console.log('settingsDefaultJson:', settingsDefaultJson);
	console.log('settingsUser:', settingsUser);
	console.log('settingsInline:', options);
	console.log('FINAL settings:', settings);
	console.log('projectType:', projectType);
	console.log('indexJsPath:', indexJsPath);
	console.log('~~~       bye        ~~~');
};

//
// read exported function names from cf index file
const indexExportedFuncs = Object.keys(indexJs);
// console.log('indexExportedFuncs:', indexExportedFuncs);
const checkboxChoices = indexExportedFuncs.map(x => {
	return { name: x }
});
// console.log('checkboxChoices', checkboxChoices);

//
// try to read from cache to find previously ranWith func deploys
// const cacheJsonPath = path.resolve(packageRootPath, 'funcy-cache.json');
const cacheJsonPath = path.resolve(packageRootPath, settings.funcyCacheFile);
try {
	// const cacheJsonStr = fs.readFileSync(cacheJsonPath, 'utf8'); // needs JSON.parse(cacheJsonStr)
	const cacheJson = require(cacheJsonPath); // "require" parses JSON automatically
	// console.log('cacheJson', cacheJson);

	for (let [i, c] of checkboxChoices.entries()) {
		// c.name IS the exported function name
		for (let cPrev of cacheJson.ranWith) {
			if (c.name == cPrev) {
				// replace choice w choice selected!
				checkboxChoices.splice(i, 1, {
					name: c.name,
					checked: true
				});
			}
		}
	}
} catch (e) {
	// console.log('no previous cache');
	// if this fails, we dont care, start as new (never been called w selections before)
}

//
// display checkbox UI picker
inquirer
	.prompt([
		{
			type: 'checkbox',
			name: 'selectedFunctions',
			message: 'Select functions to deploy:',
			choices: checkboxChoices,
			validate(answer) {
				if (answer.length < 1) {
					// return 'Choose at least one.';
					return true; // sure, cancel it all - no validation...
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
		// console.log(JSON.stringify(answers, null, '  ')); // test

		if (answers['selectedFunctions']) {
			const funcs = answers['selectedFunctions'];
			// console.log('funcs:', funcs);

			if (!funcs || !funcs.length) {
				// dont do anything...
				return;
			}

			const funcsAsCommaList = funcs.join(',');
			// console.log('funcsAsCommaList:', funcsAsCommaList);

			// example firebase cf format:
			// $ firebase deploy --only functions:addMessage,functions:makeUppercase
			const command = `firebase deploy --only functions:${funcsAsCommaList}`;

			console.log('deploying:', funcsAsCommaList);
			console.log(command);

			exec(command, (error, stdout, stderr) => {
				if (error) {
					console.log(`error: ${error.message}`);
					return;
				}
				if (stderr) {
					console.log(`stderr: ${stderr}`);
					return;
				}
				// console.log(`stdout: ${stdout}`);
			}).stdout.pipe(process.stdout); // prints logs of exec call

			// write cache
			fs.writeFile(
				cacheJsonPath,
				JSON.stringify({
					ranWith: funcs
				}),
				function (err) {
					if (err) return console.log(err);
					// console.log('saved cache file');
				}
			);
		}

		return;
	});
