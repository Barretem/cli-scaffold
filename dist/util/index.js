"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promisify = exports.parseGitUrl = exports.gitClone = exports.getYarnLock = exports.getPkgItemByKey = exports.shouldUseCnpm = exports.shouldUseYarn = exports.printPkgVersion = exports.getPkgVersion = exports.getRootPath = void 0;
const path = require("path");
const child_process = require("child_process");
const fs = require("fs-extra");
const execa = require("execa");
const GitUrlParse = require("git-url-parse");
const execSync = child_process.execSync;
function getRootPath() {
    return path.resolve(__dirname, '../../');
}
exports.getRootPath = getRootPath;
function getPkgVersion() {
    return require(path.join(getRootPath(), 'package.json')).version;
}
exports.getPkgVersion = getPkgVersion;
function printPkgVersion() {
    const sPaaSVersion = getPkgVersion();
    console.log(`🐫 SPaaS v${sPaaSVersion}`);
    console.log();
}
exports.printPkgVersion = printPkgVersion;
function shouldUseYarn() {
    try {
        execSync('yarn --version', { stdio: 'ignore' });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.shouldUseYarn = shouldUseYarn;
function shouldUseCnpm() {
    try {
        execSync('cnpm --version', { stdio: 'ignore' });
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.shouldUseCnpm = shouldUseCnpm;
function getPkgItemByKey(key) {
    const packageMap = require(path.join(getRootPath(), 'package.json'));
    if (Object.keys(packageMap).indexOf(key) === -1) {
        return {};
    }
    else {
        return packageMap[key];
    }
}
exports.getPkgItemByKey = getPkgItemByKey;
function getYarnLock() {
    const pkgPath = path.join(path.join(getRootPath(), 'yarn.lock'));
    return fs.existsSync(pkgPath);
}
exports.getYarnLock = getYarnLock;
/**
 * 克隆区块的地址
 * @param {*} ctx
 * @param {*} mySpinner
 */
function gitClone(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        // 如果原来仓库有，则先删除再clone
        const targetPath = `${ctx.moduleTempPath}/${ctx.id}`;
        if (fs.existsSync(targetPath)) {
            // 清除原来的目录
            fs.removeSync(targetPath);
        }
        const anyFn = execa;
        return anyFn('git', ['clone', ctx.repo, ctx.id, '--single-branch', '--recurse-submodules', '-b', ctx.branch], {
            cwd: ctx.moduleTempPath,
            stdio: 'inherit'
        });
    });
}
exports.gitClone = gitClone;
;
/**
 * 格式化仓库地址
 * @param url 仓库地址
 */
function parseGitUrl(url) {
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
exports.parseGitUrl = parseGitUrl;
/**
 * 将异步函数变同步
 * @param fn
 * @source https://cnodejs.org/topic/567650c3c096b56a0c1b4352
 */
function promisify(fn) {
    return function (...args) {
        return new Promise(function (resolve, reject) {
            [].push.call(args, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
            fn.apply(null, args);
        });
    };
}
exports.promisify = promisify;
