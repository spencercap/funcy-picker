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
const settings = settingsDefaultJson;

//
// inline settings
program
	.option('-d, --debug', 'debug mode on')
	.option('-s, --settings-path <path>', 'user settings path (default: ./settings.json)') // relative to project
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
	const userSettingsPath = path.resolve(projectRootPath, options.settingsPath || 'settings.json');
	console.log('userSettingsPath', userSettingsPath);
	settingsUser = require(userSettingsPath);

	if (settingsUser) {
		console.log('user settings:', settingsUser);

		for (let [sKey, sVal] of Object.entries(settingsUser)) {
			settings[sKey] = sVal;
		}
	}
} catch (e) {
	// console.log('no user settings...');
	// its ok
}

console.log('using settings:', settings);

//
// read PROJECT package.json (for main ouput index.js path)
const projectJson = require(path.resolve(projectRootPath, 'package.json'));
const projectMainJsPath = projectJson.main;
// console.log('projectMainJsPath', projectMainJsPath);
if (projectMainJsPath) {
	if (projectMainJsPath.substring(0, 2) == '..') {
		console.log('what are you doing building to outside your root directory?');
		return;
	} else if (projectMainJsPath.substring(0, 1) == '..') {
		// lop off relative "." for path resolve use
		projectMainJsPath = projectMainJsPath.substring(1);
	}
}

//
// is it a TS or JS project?
let projectType = 'js'; // or 'ts'
let buildScriptName = 'build'; // configurable in settings.json but usually its "build"
if ('devDependencies' in projectJson) {
	// console.log('projectJson.devDependencies', projectJson.devDependencies);
	if ('typescript' in projectJson.devDependencies) {
		projectType = 'ts';
	}
}
console.log('projectType:', projectType);
// + TODO
// const projectTypeOverride = option.projectTypeOverride; // 'js' | 'ts' from cli args OR settings.json
// projectType = projectTypeOverride;

// cache setup
const cachePath = path.resolve(packageRootPath, 'cache');
const cacheJsonPath = path.resolve(cachePath, 'cache.json');

//
// read built/final functions index.js
let SrcIndex = null;
try {
	const pathIndex = path.resolve(projectRootPath, projectMainJsPath);
	// console.log('pathIndex', pathIndex);
	SrcIndex = require(pathIndex);
} catch (e) {
	console.log('no index.js file');
	return;
}

//
// --- handle options ---

/**
 * 1. use default settings.json (as base)
 * 2. use settings.json config (project set)
 * 3. (optional) override w cli args (runtime set)
 * 4. go parse project + populate command
 */

if (options.debug) {
	console.log('~~ hello (de)bugger ~~');
	console.log('settingsDefaultJson:', settingsDefaultJson);
	// TODO user/repo settings
	console.log('inline cli args:', options)
	// using these settings: ...
};

if (options.indexPath) {
	// TODO override default path + settings.json configured path w inline cli arg
	console.log('override path w cli arg');
	// set path...
}

//
const exportedFuncs = Object.keys(SrcIndex);
// console.log('exportedFuncs:', exportedFuncs);
const choices = exportedFuncs.map(x => {
	return { name: x }
});
// console.log('choices', choices);

//
// try read from cache to find previously ranWith func deploys
try {
	// const cacheJsonStr = fs.readFileSync(cacheJsonPath, 'utf8'); // needs JSON.parse(cacheJsonStr)
	const cacheJson = require(cacheJsonPath); // "require" parses JSON automatically
	// console.log('cacheJson', cacheJson);

	for (let [i, c] of choices.entries()) {
		// c.name == exported function name
		for (let cPrev of cacheJson.ranWith) {
			if (c.name == cPrev) {
				// replace choice w choice selected!
				choices.splice(i, 1, {
					name: c.name,
					checked: true
				});
			}
		}
	}
} catch (e) {
	// console.log('no previous cache');
	// if this fails, we dont care - start as new (never been called w selections before)
	// console.log('no previous call cache');
}

//
// display checkbox UI picker
inquirer
	.prompt([
		{
			type: 'checkbox',
			name: 'selectedFunctions',
			message: 'Select functions to deploy:',
			choices: choices,
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
				console.log(`stdout: ${stdout}`);
			}).stdout.pipe(process.stdout); // prints logs of exec call

			// creates "cache" dir (if OR if it doesnt exist)
			// FYI cache is kept local to package, ex: node_modules/funcy-picker/cache/...
			fs.mkdir(cachePath, { recursive: true }, (err) => {
				if (err) throw err;
			});

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
