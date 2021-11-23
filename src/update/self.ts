
import * as Child from 'child_process';
import * as ora from 'ora';

import { PRIVATE_NPM } from '../util/constants';
import { shouldUseCnpm } from '../util/index';

const exec = Child.exec;

export default class Self {
  init() {
    let command
    if (shouldUseCnpm()) {
      command = `cnpm i -g @spaas/cli@latest --registry=${PRIVATE_NPM}`
    } else {
      command = `npm i -g @spaas/cli@latest --registry=${PRIVATE_NPM}`
    }

    const child: any = exec(command)

    const spinner = ora('即将将 SPaaS 开发工具 spaas-cli 更新到最新版本...').start()

    child.stdout.on('data', function (data) {
      console.log(data)
      spinner.stop()
    })
    child.stderr.on('data', function (data) {
      console.log(data)
      spinner.stop()
    })
  }
}
