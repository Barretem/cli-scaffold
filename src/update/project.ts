import path from 'path';
import * as fs from 'fs-extra'
import chalk from 'chalk'
import packageJson from 'package-json';
import SPaaSYarn from '../yarn/index';

import { UPDATE_PACKAGE_LIST, PRIVATE_NPM } from '../util/constants';

/**
 * 获取npm包的最新配置
 * @param packageName 包名
 * @param options package-json配置
 */
const getLatestVersion = async (packageName, options) => {
  return packageJson(packageName, options);
}

export default class UpdateProject {
  private pkgPath: string

  constructor() {
      this.pkgPath = path.join(process.cwd(), 'package.json')
  }

  async init() {
    if (!fs.existsSync(this.pkgPath)) {
      console.log(chalk.red('找不到Package.json，请确定当前目录是项目根目录!'))
      process.exit(1)
    }
    const packageMap = require(this.pkgPath)

    // 更新 @spaas/* 版本
    const dependenciesKeys = Object.keys(packageMap.dependencies)
    for (const key of dependenciesKeys) {
      if (UPDATE_PACKAGE_LIST.indexOf(key) !== -1) {
        packageMap.dependencies[key] = await getLatestVersion(key, {
          registryUrl: PRIVATE_NPM
        })
      }
    }

    const devDependencies = Object.keys(packageMap.devDependencies)

    for (const key of devDependencies) {
      if (UPDATE_PACKAGE_LIST.indexOf(key) !== -1) {
        packageMap.devDependencies[key] = await getLatestVersion(key, {
          registryUrl: PRIVATE_NPM
        })
      }
    }

    // 写入package.json
    try {
      await fs.writeJson(this.pkgPath, packageMap, { spaces: '\t' })
      console.log(chalk.green('更新项目 package.json 成功！'))
      console.log()
    } catch (err) {
      console.error(err)
    }
    const installPkg = new SPaaSYarn({
      argv: []
    });
    installPkg.init();
  }
}
