
import * as ChildApp from '@spaas/spaas-app';
import * as fs from 'fs-extra'
import * as path from 'path';

export default class UpdateModule {
  init() {
    // 1、在项目里面创建main文件夹
    // 2、在项目里面创建modules文件夹 TODO
    // 3、将src里面的内容拷贝到modules文件夹里面 TODO
    // 4、遍历modules文件夹中的文件，将@/改为@/../modules/ TODO
    // 5、将对应的依赖安装好
    // 6、根据pages文件夹里面的内容生成route.js TODO
    // 7、script 文件中的nuxt改为spaas nuxt
    // 8、生成spaas.config.js文件
    // 9、生成proxy.config.js文件

    // 1、在项目里面创建main文件夹
    // 5、将对应的依赖安装好
    // 7、script 文件中的nuxt改为spaas nuxt
    // 8、生成spaas.config.js文件
    this.createMainFile();
    this.addDependencies();
  }
  // 1、在项目里面创建main文件夹
  createMainFile() {
    const { templateDirPaths, templateFilePaths } = ChildApp;
    const mainPaths = templateDirPaths.filter(item => item.match(/(\/template\/main)$/g));
    const mainPath = mainPaths[0];
    const targetDirPath = path.join(process.cwd(), './main');
    fs.copySync(mainPath, targetDirPath);
    // 8、生成spaas.config.js文件
    const spaasConfigPaths = templateFilePaths.filter(item => item.match(/\/spaas\.config\.js$/g));
    const spaasConfigPath = spaasConfigPaths[0];
    fs.copyFileSync(spaasConfigPath, `${process.cwd()}/spaas.config.js`);
  }
  // 5、将对应的依赖安装好
  addDependencies() {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageMap = require(packagePath);
    const cliVersion = packageMap.version;
    const devDependencies = {
      '@spaas/cli': `^${cliVersion}`,
      '@nuxtjs/dotenv': '^1.3.0',
      '@nuxtjs/style-resources': '^0.1.2',
      'cross-env': '^5.1.3',
      'nuxt': '^2.8.1',
  		'svg-sprite-loader': '^4.1.6'
    };
    const dependencies = {
      '@femessage/el-data-table': '^1.15.1',
      '@femessage/el-form-renderer': '^1.12.1',
      '@nuxtjs/axios': '^5.5.4',
      'clipboard': '^2.0.4',
      'dayjs': '^1.7.4',
      'js-cookie': '^2.2.0',
      'path-to-regexp': '^3.0.0',
		  'resize-observer-polyfill': '^1.5.0'
    };

    const currentPackagePath = path.join(process.cwd(), './package.json');
    const currentPackageMap = require(currentPackagePath);
    for(const item in devDependencies) {
      currentPackageMap.devDependencies[item] = devDependencies[item];
      delete currentPackageMap.dependencies[item];
    }
    for (const item in dependencies) {
      currentPackageMap.dependencies[item] = dependencies[item];
      delete currentPackageMap.devDependencies[item];
    }
    // 7、script 文件中的nuxt改为spaas nuxt
    for(const item in currentPackageMap.scripts) {
      currentPackageMap.scripts[item] = currentPackageMap.scripts[item].replace(/ nuxt/g, ' spaas nuxt')
    }

    fs.writeJsonSync(currentPackagePath, currentPackageMap, { spaces: '\t' });
  }
}
