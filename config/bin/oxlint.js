#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const entryPath = require.resolve('oxlint');
const binPath = join(dirname(dirname(entryPath)), 'bin/oxlint');
const originalArgs = process.argv.slice(2);

const hasConfigArg = originalArgs.some((arg) => (
	arg === '-c' ||
	arg === '--config' ||
	arg.startsWith('--config=')
));

const configCandidates = [
	'oxlint.config.ts',
	'oxlint.config.js',
	'oxlint.config.mjs',
	'oxlint.config.cjs',
	'oxlint.config.json',
];

const autoConfig = hasConfigArg
	? null
	: configCandidates.find((configName) => existsSync(join(process.cwd(), configName))) ?? null;

const args = autoConfig === null
	? originalArgs
	: ['-c', autoConfig, ...originalArgs];

const child = spawn(process.execPath, [binPath, ...args], {
	stdio: 'inherit',
	cwd: process.cwd(),
});

child.on('exit', (code) => {
	process.exit(code ?? 0);
});
