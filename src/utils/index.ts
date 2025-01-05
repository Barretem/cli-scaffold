import * as path from 'path'
import * as child_process from 'child_process'
import * as fs from 'fs-extra'

const execSync = child_process.execSync

export function getRootPath(): string {
  return path.resolve(__dirname, '../../')
}

export function getPkgVersion(): string {
  return require(path.join(getRootPath(), 'package.json')).version
}

export function printPkgVersion() {
  const sPaaSVersion = getPkgVersion()
  console.log(`🐫 SPaaS v${sPaaSVersion}`)
  console.log()
}

export function shouldUseYarn(): boolean {
  try {
    execSync('yarn --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

export function shouldUseCnpm(): boolean {
  try {
    execSync('cnpm --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

export function getPkgItemByKey(key: string) {
  const packageMap = require(path.join(getRootPath(), 'package.json'))
  if (Object.keys(packageMap).indexOf(key) === -1) {
    return {}
  } else {
    return packageMap[key]
  }
}

export function getYarnLock (): boolean {
  const pkgPath = path.join(path.join(getRootPath(), 'yarn.lock'))
  return fs.existsSync(pkgPath)
}

/**
 * 将异步函数变同步
 * @param fn
 * @source https://cnodejs.org/topic/567650c3c096b56a0c1b4352
 */
export function promisify(fn) {
  return function(...args) {
    return new Promise(function(resolve, reject) {
      [].push.call(args, function(err, result) {
        if(err) {
          reject(err);
        }else {
          resolve(result);
        }
      });
      fn.apply(null, args);
    });
  }
}