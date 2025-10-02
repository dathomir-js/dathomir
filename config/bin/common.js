import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);

/**
 * 指定されたパッケージのbinスクリプトを実行する
 * @param {string} modulePath - require.resolve()で解決するモジュールパス
 * @param {boolean} useNode - process.execPathを使用するかどうか
 */
export function executeBin(modulePath, useNode = true) {
  const binPath = require.resolve(modulePath);
  const args = process.argv.slice(2);

  const child = useNode
    ? spawn(process.execPath, [binPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    : spawn(binPath, args, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

/**
 * package.jsonから相対パスでbinを解決して実行する
 * @param {string} packageName - パッケージ名
 * @param {string} relativeBinPath - package.jsonからの相対パス
 */
export function executeBinFromPackage(packageName, relativeBinPath) {
  const pkgPath = require.resolve(`${packageName}/package.json`);
  const binPath = join(dirname(pkgPath), relativeBinPath);
  const args = process.argv.slice(2);

  const child = spawn(process.execPath, [binPath, ...args], {
    stdio: 'inherit',
    cwd: process.cwd()
  });


  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
