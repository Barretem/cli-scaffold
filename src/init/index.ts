import * as inquirer from 'inquirer';

import Module from './module';
import Project from './project';
import MicroMain from './microMain';
import MicroChild from './microChild';

interface SelectTypeInter {
  projectName: string
  description?: string
  version?: string
  type: string
}

interface AskMethods {
  (conf: SelectTypeInter, prompts: object[], choices?: string[]): void
}

export default class SelectType {
  public conf: SelectTypeInter

  constructor(options?: SelectTypeInter) {
    this.conf = Object.assign({
      projectName: '',
      description: '',
      version: '',
      type: ''
    }, options || {})
  }
  async init() {
    await this.ask()
      .then(async answers => {
        this.conf = Object.assign(this.conf, answers);
      })
    const { type, projectName, description, version } = this.conf;
    if (type === '子应用模板') {
      const module = new Module({
        projectName,
        description,
        version
      });
      module.create();
    } else if(type === '微前端主应用模块') {
      const microMain = new MicroMain({
        projectName,
        description,
        version
      });
      microMain.create();
    } else if(type === '微前端子应用模块') {
      const microMain = new MicroChild({
        projectName,
        description,
        version
      });
      microMain.create();
    } else {
      const project = new Project({
        projectName,
        description,
        version
      });
      project.create();
    }
  }

  ask () {
    const prompts: object[] = []
    const conf = this.conf
    this.askType(conf, prompts)
    return inquirer.prompt(prompts)
  }

  askType: AskMethods = function (conf, prompts) {
    prompts.push({
      type: 'list',
      name: 'type',
      message: '请选择要初始化的模板',
      default: '默认项目模板',
      choices: [ 
        '默认项目模板', 
        '子应用模板',
        '微前端主应用模块',
        '微前端子应用模块'
      ]
    })
  }
}
