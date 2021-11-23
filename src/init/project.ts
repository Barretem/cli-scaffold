
import chalk from 'chalk'
import * as ora from 'ora'
import * as fs from 'fs-extra'
import * as download from 'download-git-repo'
import * as inquirer from 'inquirer'
import * as path from 'path';

import { DEFAULT_TEMPLATE_SRC } from '../util/constants'

export interface IProjectConf {
  projectName: string;
  description?: string;
  version?: string;
}

interface AskMethods {
  (conf: IProjectConf, prompts: object[], choices?: string[]): void
}

export default class Project {
  public conf: IProjectConf

  constructor(options?: IProjectConf) {
    this.conf = Object.assign({
      projectName: '',
      description: '',
      version: '1.0.0'
    }, options || {})
  }

  create () {
    console.log(chalk.green(`SPaaS即将创建一个新项目!`))
    this.ask()
      .then(async (answers) => {
        this.conf = Object.assign(this.conf, answers)
        await this.downTemplate()
      })
      .catch(err => console.log(chalk.red('创建项目失败: ', err)))
      .finally(() => {
          process.exit(1)
      })
  }

  downTemplate() {
    return new Promise(async (resolve, reject) => {
      const projectName = this.conf.projectName;
      const spinner = ora(`正在从 ${DEFAULT_TEMPLATE_SRC} 拉取远程模板...`).start()

      download(DEFAULT_TEMPLATE_SRC, `./${projectName}`, async error => {
        if (error) {
          spinner.color = 'red'
          spinner.fail(chalk.red('拉取远程模板仓库失败！'))
          await fs.remove(`./${projectName}`)
          return reject()
        }
        // 2、获取对应的json文件，更改对应的name,version,description
        const packagePath = path.join(process.cwd(), `./${projectName}/package.json`);
        const packageMap = require(packagePath);
        packageMap.name = projectName;
        packageMap.version = this.conf.version;
        packageMap.description = this.conf.description;
        fs.writeJsonSync(packagePath, packageMap, {spaces: '\t'});

        spinner.color = 'green'
        spinner.succeed(`${chalk.grey('拉取远程模板仓库成功！')}`)
        console.log(`${chalk.green('✔ ')}${chalk.grey(`创建项目: ${chalk.grey.bold(projectName)}`)}`)
        console.log(chalk.green(`请进入项目目录 ${chalk.green.bold(projectName)} 开始工作吧！😝`))
        resolve()
      })
    });
  }

  ask () {
    const prompts: object[] = []
    const conf = this.conf

    this.askProjectName(conf, prompts)
    this.askVersion(conf, prompts)
    this.askDescription(conf, prompts)

    return inquirer.prompt(prompts)
  }

  askProjectName: AskMethods = function (conf, prompts) {
    if (typeof conf.projectName as string | undefined !== 'string') {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称！',
        validate (input) {
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
        validate (input) {
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
    if (typeof conf.description !== 'string') {
      prompts.push({
        type: 'input',
        name: 'version',
        message: '请输入项目版本号(默认为1.0.0)',
        default: '1.0.0'
      })
    }
  }

  askDescription: AskMethods = function (conf, prompts) {
    if (typeof conf.description !== 'string') {
      prompts.push({
        type: 'input',
        name: 'description',
        message: '请输入项目介绍！'
      })
    }
  }
}
