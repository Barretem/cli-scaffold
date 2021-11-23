const Template = require('@spaas/spaas-app');
import * as fs from 'fs-extra'
import * as path from 'path'
import * as fg from 'fast-glob'
const exec = require('child_process').exec
const ora = require('ora')

interface IndexOptions {
  argv: string[]
}

const DEFAULT_CONFIG_PATH = './.spaas/nuxt.config.js';
const SVG_ICON_PATH = './.spaas/icons/svg';
const DEFAULT_EXTEND_CONFIG_PATH: string = './config/index.js';
const CONFIG_DIR: string = './config';
const DEFAULT_CONFIG_INDEX_PATH = './.spaas/config/index.js';

export default class Index {
  public conf: IndexOptions
  public _argv: string[]

  constructor(options: IndexOptions) {
    this.conf = options;
    const argv = options.argv;
    // 处理请求的参数数组，如果数组中没有有-c 或者 --config-file的配置，则将对应的默认配置插入
    let hasConfig = false;
    for(const item of argv) {
      if(item === '-c' || item === '--config-file') {
        hasConfig = true;
        break;
      }
    }
    if (!hasConfig) {
      argv.push('--config-file');
      argv.push(DEFAULT_CONFIG_PATH);
    }
    this._argv = argv;
  }

  async init() {
    try {
      await this.cloneMainApp(Template.dir);
      this.createRouterFile();
      this.createDefaultConfigFile();
      // 将模块中的icons全部拷贝到.spaas/icons/svg文件夹下
      this.copyIcons();
      this.runNuxtCommand();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * 将主应用安装到子应用里面
   */
  async cloneMainApp(sourcePath) {
    const targetPath = path.join(process.cwd(), '.spaas');
    if (fs.existsSync(targetPath)) {
      // 清除原来的.spaas目录
      fs.removeSync(targetPath);
    }
    return fs.copySync(sourcePath, targetPath);
  }
  // 1、将对应的项目依赖拷贝到项目里面
  // 2、查找src文件夹下的所有router文件，生成对应的路由文件
  // 3、执行nuxt start config
  /**
   * 查找src文件夹下的所有router文件，生成对应的路由文件
   */
  createRouterFile() {
    const filePath = fg.sync(path.join(process.cwd(), '/modules/**/route.js'), {
      deep: 2,
      onlyFiles: true
    });
    const routes = filePath.reduce((pre, cur: any) => {
      const file = require(cur).default;
      const reg = /(?<=\/modules)(.*?)(?=\/route.js)/;
      const modulePath = cur.match(reg) ? cur.match(reg)[0] : '';
      const targetRoutes = file.map(info => {
        return {
          ...info,
          modulePath
        }
      })
      return pre.concat(targetRoutes)
    }, []);
    // 将多维数组改为一维数组
    const normalArr = this.arr2DToNormal(routes);
    // 生成对应的JSON文件
    this.setRouteAction(normalArr);
  }

  /**
   * 创建默认的config文件
   */
  createDefaultConfigFile = () => {
    const filePath = path.join(process.cwd(), DEFAULT_EXTEND_CONFIG_PATH);
    const dirPath = path.join(process.cwd(), CONFIG_DIR);
    const sourceFilePath = path.join(process.cwd(), DEFAULT_CONFIG_INDEX_PATH);
    if (fs.existsSync(filePath)) return;
    fs.ensureDirSync(dirPath);
    return fs.copyFileSync(sourceFilePath, filePath)
  }

  arr2DToNormal = arr2D => {
    const list: any = [];
    function getList(treeData, parentPath) {
      treeData.map((item, index) => {
        const { path } = item;
        const wholePath = `${parentPath}${path}`;
        list.push({
          ...item,
          path: wholePath
        });
        if (item.children && item.children.length > 0) {
          getList(item.children, `${wholePath}/`);
        }
      });
    }
    getList(arr2D, '');
    return list;
  }

  setRouteAction = routeList => {
    const navPath = path.resolve(process.cwd(), './.spaas/const/route-info.json');

    const routerInfoJson = {};

    routeList.forEach(item => {
      const { path } = item;

      const routePath = path.startsWith('/') ? path : `/${path}`;

      // 路由匹配的是 : 不是 下划线
      routerInfoJson[routePath.replace(/_/g, ':')] = item;
    })

    fs.writeFileSync(navPath, JSON.stringify(routerInfoJson, null, '   '), 'utf-8');
  }

  // 将模块中的icons全部拷贝到.spaas/icons/svg文件夹下
  copyIcons() {
    const filePath:string[] = fg.sync(path.join(process.cwd(), '/modules/**/icons'), {
      deep: 2,
      onlyDirectories: true
    });
    filePath.forEach(item => {
      fs.copySync(item, SVG_ICON_PATH);
    });
  }

  /**
   * 执行Nuxt命令
   */
  runNuxtCommand() {
    const command = this._argv.join(' ');
    const nuxtCommand = `npx nuxt ${command}`

    const child = exec(nuxtCommand)
    const spinner = ora('即将启动Nuxt...').start()
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
