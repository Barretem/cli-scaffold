import * as path from 'path'
import * as child_process from 'child_process'
import * as fs from 'fs-extra'
import * as execa from 'execa';
import * as GitUrlParse from 'git-url-parse';

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

interface GitCtxOptions {
  repo: string,
  id: string,
  branch: string,
  moduleTempPath: string,
}
/**
 * 克隆区块的地址
 * @param {*} ctx
 * @param {*} mySpinner
 */

export async function gitClone(ctx: GitCtxOptions): Promise<void> {
  // 如果原来仓库有，则先删除再clone
  const targetPath = `${ctx.moduleTempPath}/${ctx.id}`
  if (fs.existsSync(targetPath)) {
    // 清除原来的目录
    fs.removeSync(targetPath);
  }
  const anyFn: any = execa;
  return anyFn(
    'git',
    ['clone', ctx.repo, ctx.id, '--single-branch', '--recurse-submodules', '-b', ctx.branch],
    {
      cwd: ctx.moduleTempPath,
      stdio: 'inherit'
    }
  );
};

interface GitUrlParseOptions {
  repo: string,
  branch: string,
  path: string,
  id: string,
}
/**
 * 格式化仓库地址
 * @param url 仓库地址
 */
export function parseGitUrl(url: string): GitUrlParseOptions {
  const args = GitUrlParse(url);
  const { ref, filepath, resource, full_name: fullName } = args;

  const repo = args.toString();

  return {
    repo,
    branch: ref,
    path: `/${filepath}`,
    id: `${resource}/${fullName}` // 唯一标识一个 git 仓库
  };
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