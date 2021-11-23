import chalk from 'chalk'
import * as fs from 'fs-extra'
import * as inquirer from 'inquirer'
import * as path from 'path';
import * as ChildApp from '@spaas/child-app';
import * as child_process from 'child_process'
import * as ora from 'ora'

import { PRIVATE_NPM } from '../util/constants';

const execSync = child_process.execSync

export interface IProjectConf {
  projectName: string
  description?: string
  version?: string
}

interface AskMethods {
  (conf: IProjectConf, prompts: object[], choices?: string[]): void
}

export default class Module {
  public conf: IProjectConf

  constructor(options?: IProjectConf) {
    this.conf = Object.assign({
      projectName: '',
      description: '',
      version: ''
    }, options || {})
  }

  create() {
    console.log(chalk.green(`SPaaS即将创建一个新项目!`))
    this.ask()
      .then(async (answers) => {
        this.conf = Object.assign(this.conf, answers)
        await this.downTemplate()
        await this.downDependent()
        const { projectName } = this.conf;
        console.log(chalk.green(`请进入项目目录 ${chalk.green.bold(projectName)} 开始工作吧！😝`));
      })
      .catch(err => console.log(chalk.red('创建项目失败: ', err)))
      .finally(() => {
        process.exit(1)
      })
  }

  downTemplate() {
    return new Promise(async (resolve, reject) => {
      const { templateFilePaths, templateDirPaths, templateFiles, templateDirs } = ChildApp;
      // 1、将对应的文件列表重命名（根据原来的命名）并拷贝到项目文件夹
      // 2、获取对应的json文件，更改对应的name,version,description
      // 3、重新写入package.json文件

      // 1、将对应的文件列表重命名（根据原来的命名）并拷贝到项目文件夹
      const { projectName, version, description } = this.conf;
      const targetPath = path.join(process.cwd(), projectName);
      fs.mkdirSync(projectName);
      try {
        templateFilePaths.forEach((item, index) => {
          const targetFilePath = path.join(targetPath, templateFiles[index]);
          fs.copyFileSync(item, targetFilePath)
        })

        templateDirPaths.forEach((item, index) => {
          const targetDirPath = path.join(targetPath, templateDirs[index]);
          fs.copySync(item, targetDirPath)
        })

        // 2、获取对应的json文件，更改对应的name,version,description
        const packagePath = path.join(targetPath, 'package.json');
        const packageMap = require(packagePath);
        packageMap.name = projectName;
        packageMap.version = version;
        packageMap.description = description;
        // 3、处理package.json的依赖
        // 4、处理script脚本, 将所有nuxt 替换为spaas nuxt
        fs.writeJsonSync(packagePath, packageMap, {spaces: '\t'});
        console.log(`${chalk.green('✔ ')}${`创建项目: ${chalk.green.bold(projectName)}`}`);
        resolve();
      } catch(err) {
        fs.rmdirSync(projectName);
        console.error(err);
        reject(err);
      }
    });
  }

  downDependent() {
    return new Promise((resolve, reject) => {
      const { projectName } = this.conf;
      const spinner = ora(`正在安装项目依赖`).start()
      console.log()
      try {
        execSync(`cd ./${projectName} && git init && yarn --registry=${PRIVATE_NPM} && cd ../`)
        spinner.color = 'green'
        spinner.succeed(`${chalk.green('安装项目依赖成功！')}`)
        resolve()
      } catch(err) {
        spinner.color = 'red'
        spinner.fail(chalk.red('安装项目依赖失败, 请稍后手动安装依赖！'))
        reject(err)
      }
    })
  }

  ask() {
    const prompts: object[] = []
    const conf = this.conf

    this.askProjectName(conf, prompts)
    this.askVersion(conf, prompts)
    this.askDescription(conf, prompts)
    return inquirer.prompt(prompts)
  }

  askProjectName: AskMethods = function (conf, prompts) {
    if (typeof conf.projectName as string | undefined !== 'string' || conf.projectName === '') {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称！',
        validate(input) {
          if (!input) {
            return '项目名不能为空！'
          }
          if (fs.existsSync(input)) {
            return '当前目录已经存在同名项目，请换一个项目名！'
          }
          return true
        }
      })
    } else if (fs.existsSync(conf.projectName)) {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '当前目录已经存在同名项目，请换一个项目名！',
        validate(input) {
          if (!input) {
            return '项目名不能为空！'
          }
          if (fs.existsSync(input)) {
            return '项目名依然重复！'
          }
          return true
        }
      })
    }
  }

  askVersion: AskMethods = function (conf, prompts) {
    if (typeof conf.version !== 'string' || conf.version === '') {
      prompts.push({
        type: 'input',
        name: 'version',
        message: '请输入项目版本号(默认为1.0.0)',
        default: '1.0.0'
      })
    }
  }

  askDescription: AskMethods = function (conf, prompts) {
    if (typeof conf.description !== 'string' || conf.description === '') {
      prompts.push({
        type: 'input',
        name: 'description',
        message: '请输入项目介绍！'
      })
    }
  }
}
