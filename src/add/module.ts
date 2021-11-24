
import chalk from 'chalk';

interface ModuleOptions {
  moduleName?: string,
  path?: string,
  branch?:string,
}

export default class Index {
  public conf: ModuleOptions
  public moduleList: string[]
  constructor(options?: ModuleOptions) {
    this.conf = options || {};
  }

  start() {
    console.log(chalk.green(`👏 欢迎使用该命令行脚手架`))
  }
}
