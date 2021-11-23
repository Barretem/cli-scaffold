const Template = require('@spaas/main-app');
import * as fs from 'fs-extra'
import * as path from 'path'


export default class Index {

  constructor() {
  }

  async init() {
    try {
      const publicDirPath: string = Template.publicDirPath;
      const srcDirPath: string = Template.srcDirPath;
      await this.cloneMainApp(publicDirPath, 'public');
      await this.cloneMainApp(srcDirPath, 'src');
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * 将主应用安装到子应用里面
   */
  async cloneMainApp(sourcePath: string, targetDirName: string) {
    const targetPath = path.join(process.cwd(), targetDirName);
    if (fs.existsSync(targetPath)) {
      // 清除原来的.spaas目录
      fs.removeSync(targetPath);
    }
    return fs.copySync(sourcePath, targetPath);
  }
}
