/**
 * 本地构建发布到OSS环境
 */
/**
 * 在项目中执行spaas build dev/qa命令
 * 读取项目中的.spaas.dev/.spaas.qa配置的OSS信息（BUILD_OSS_KEY、 BUILD_OSS_SECRET、BUILD_OSS_BUCKET、BUILD_OSS_REGION ）
 * 拼接项目中固定的文件目录；
 * 生成publicPath, 写入到对应的.dev/.qa文件中;
 * 编译构建生成对应的文件；
 * 删除原有的OSS文件 // TODO
 * 将文件拷贝到OSS临时文件夹 // TODO
 * 将原有文件夹重命名 // TODO
 * 将临时文件夹重命名为原有文件夹 // TODO
 * 删除原有的临时文件夹
 * 将文件拷贝到OSS；
 * 根据.spaas.dev/.spaas.qa文件夹中的配置konga
 */
import chalk from 'chalk'

import { promisify } from '../util/index';

const childProcess = require('child_process');
const OSS = require('ali-oss');

import {
  IBuildConfig,
  IBuildOptions,
  ISPaaSBuildConfig,
  IBuildFunc
} from './index.d';

const fs = require('fs')
const path = require('path')
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat)

export default class Build implements IBuildFunc {
  /**
   * 传入的conf配置
   * @type {IBuildConfig}
   * @memberof Build
   */
  public conf: IBuildConfig

  /**
   * 读取的env环境配置
   * @type {ISPaaSBuildConfig}
   * @memberof Build
   */
  public envConf: ISPaaSBuildConfig

  /**
   * 构建出来的文件路径数组
   * @type {string[]}
   * @memberof Build
   */
  public distFilePath: string[] = []

  /**
   * OSS服务器配置
   * @memberof Build
   */
  public client

  /**
   * 在构建之前的环境变量
   * @type {string}
   * @memberof Build
   */
  beforeBuildEnv: string

  constructor(options:IBuildOptions) {
    const {
      configPath,
      encoding,
      type
    } = options;
    this.conf = {
      type,
      configPath: configPath || `./.spaas.${type}.env`,
      encoding: encoding || 'utf8'
    }
  }

  get ossProjectBasePath(): string {
    const reg = /^((https?:)?)\/\/(([a-zA-Z0-9_-])+(\.)?)*(\/*)/
    const ossFilePath = this.envConf.PUBLIC_PATH.replace(reg, '/');
    return ossFilePath.replace(/\/$/, '')
  }

  // 项目的缓存文件夹目录
  get ossProjectTempPath(): string {
    return `${this.ossProjectBasePath}_temp`
  }

  async run() {
    // 读取原有的配置文件
    const beforeBuildEnv = this.readEnvFile();
    if(!beforeBuildEnv) return;
    this.beforeBuildEnv = beforeBuildEnv;
  
    // 读取项目中的.spaas.dev/.spaas.qa配置的OSS信息（BUILD_OSS_KEY、 BUILD_OSS_SECRET、BUILD_OSS_BUCKET、BUILD_OSS_REGION ）
    const envConfig = this.asyncReadFileAndFormatConfig()
    if (!envConfig) return
    this.envConf = envConfig;
  
    // 将publicPath写入到node环境变量中，并写入到对应的.spaas.dev/.spaas.qa文件中
    const writeStatus = this.writePublicPath();
    if(!writeStatus) return;
    
    // 编译构建生成对应的文件；
    const status = await this.buildProject();
    if(!status) return;
    
    // 将文件拷贝到OSS；
    await this.transportFileToOss()

    // 恢复原有的env数据
    this.restoreEnvFile();
  }

  /**
   * 将字符串格式化为对象
   * @param {(string | Buffer)} src
   * @returns {object}
   * @memberof Build
   */
  parse (src: string | Buffer ): ISPaaSBuildConfig | null {
    const NEWLINE = '\n'
    const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
    const RE_NEWLINES = /\\n/g
    const NEWLINES_MATCH = /\n|\r|\r\n/

    const obj = {} as ISPaaSBuildConfig
  
    // convert Buffers before splitting into lines and processing
    src.toString().split(NEWLINES_MATCH).forEach((line, idx) => {
      // matching "KEY' and 'VAL' in 'KEY=VAL'
      const keyValueArr = line.match(RE_INI_KEY_VAL)
      // matched?
      if (keyValueArr !== null) {
        const key = keyValueArr[1]
        // default undefined or missing values to empty string
        let val = (keyValueArr[2] || '')
        const end = val.length - 1
        const isDoubleQuoted = val[0] === '"' && val[end] === '"'
        const isSingleQuoted = val[0] === "'" && val[end] === "'"
  
        // if single or double quoted, remove quotes
        if (isSingleQuoted || isDoubleQuoted) {
          val = val.substring(1, end)
  
          // if double quoted, expand newlines
          if (isDoubleQuoted) {
            val = val.replace(RE_NEWLINES, NEWLINE)
          }
        } else {
          // remove surrounding whitespace
          val = val.trim()
        }
  
        obj[key] = val
      }
    })
  
    return Object.keys(obj).length ? obj : null;
  }
  /**
   * 根据配置文件路径读取oss配置信息
   * @param filePath 配置文件路径
   */
  asyncReadFileAndFormatConfig(): ISPaaSBuildConfig | null {
    const { encoding, configPath } = this.conf;

    const spaasConfigPath = path.resolve(process.cwd(), configPath)
    console.log(`正在读取${spaasConfigPath}配置文件`);
    
    const parsed = this.parse(fs.readFileSync(spaasConfigPath, { encoding }))
    if(!parsed) {
      console.log(`${chalk.red(`读取${spaasConfigPath}配置文件失败，请确认配置是否正确！`)}`);
      return null
    }
  
    const mustHasKeys = [
      'BUILD_OSS_KEY', 
      'BUILD_OSS_SECRET', 
      'BUILD_OSS_BUCKET', 
      'BUILD_OSS_REGION', 
      'PUBLIC_PATH',
      'BUILD_ACCESS_PATH'
    ];
    const notExitKeys: typeof mustHasKeys = [];
    for(const item of mustHasKeys) {
      if(!parsed[item]) {
        notExitKeys.push(item)
      }
    }
    if(notExitKeys.length) {
      console.log(chalk.red(`配置文件${spaasConfigPath}中缺少${notExitKeys.join(',')}的配置`))
      return null
    }
    const { PUBLIC_PATH } = parsed;
    const reg = /^((https?:)?)\/\/(([a-zA-Z0-9_-])+(\.)?)*(\/((\.)?[a-zA-Z0-9_-])*)*$/i;
    if(!reg.test(PUBLIC_PATH)) {
      console.log(`${chalk.red('❌ ')}${chalk.grey(`PUBLIC_PATH格式不正确`)}`);
    }

    console.log(`${chalk.green(spaasConfigPath)}配置文件读取完成`);
    return parsed;
  }

  /**
   * 执行yarn build命令，生成dist文件夹
   */
  buildProject(): Promise<boolean> {
    console.log('正在构建项目...')
    return new Promise((resolve, reject) => {
      try {
        const child = childProcess.exec('yarn build');
        child.stdout.on('data', (data) => {
          console.log(data)
        })
        child.stderr.on('data', (data) => {
          console.log(chalk.yellow(data))
        })
        child.on('close', (code) => {
          if(code >= 1) {
            console.log(`${chalk.red('项目构建失败，请重试！！')}`)
            reject(false)
          } else {
            console.log(`${chalk.green('项目构建成功')}`)
            resolve(true);
          }
        });
      } catch(e) {
        console.log(`${chalk.red('项目构建失败，请重试！！')}`)
        reject(false)
      }
    })
  }

  /**
   * 将本地文件搬运到OSS上
   * @param sourcePath 本地的构建文件目录
   * @param ossConfig 发布需要用到的OSSConfig文件
   */
  async transportFileToOss(): Promise<boolean> {
    console.log(chalk.green('正在将代码拷贝到OSS服务器，请稍后...'))

    const distDir = path.resolve(process.cwd(), './dist');
    // 读取本地文件列表
    try {
      // object表示上传到OSS的Object名称，localfile表示本地文件或者文件路径
      await this.readDirRecur(distDir);
    } catch(e) {
      console.error('error: %j', e);
    }

    // 遍历文件列表，上传到oss
    const {
      BUILD_OSS_KEY,
      BUILD_OSS_SECRET,
      BUILD_OSS_BUCKET,
      BUILD_OSS_REGION
    } = this.envConf;
    this.client = new OSS({
      region: BUILD_OSS_REGION,
      accessKeyId: BUILD_OSS_KEY,
      accessKeySecret: BUILD_OSS_SECRET,
      bucket: BUILD_OSS_BUCKET
    });
    
    const promiseArr: Promise<boolean>[] = []
    for(const item of this.distFilePath) {
      promiseArr.push(this.uploadFileOneByOne(item))
    }
    return Promise.all(promiseArr).then((res) => {
      return !Boolean(res.filter(item => item === false).length)
    }).then(status => {
      if(status) {
        console.log(chalk.green('项目已经上传到OSS，快点去回归测试一下吧！'));
        console.log(`项目的访问地址为：${chalk.green(this.envConf.BUILD_ACCESS_PATH)}`);
      } else {
        console.log(chalk.red('项目上传到OSS失败，请重试！'));
      }
      return status;
    })
  }

  uploadFileOneByOne(filePath: string): Promise<boolean> {
    const fileName = filePath.replace(`${process.cwd()}/dist`, this.ossProjectBasePath)
    console.log(`正在将${chalk.green(filePath)}文件上传到${chalk.green(fileName)}中...`)
    return this.client.multipartUpload(fileName, filePath).then(res => true).catch(e => {
      return false
    })
  }

  /**
   * 
   * @param fileDir string 
   */
  readDirRecur(fileDir: string): Promise<string[]> {
    return readdir(fileDir).then((files: Promise<any>[]) => {
      files = files.map((item) => {
        const fullPath = fileDir + '/' + item; 
        // @ts-ignore
        return stat(fullPath).then((stats: any) => {
            if (stats.isDirectory()) {
                return this.readDirRecur(fullPath);
            }else{
              /*not use ignore files*/
              if(item[0] !== '.'){
                this.distFilePath.push(fullPath);
                return fullPath;
              }
            }
          })
      });
      return Promise.all(files);
    });
  }

  /**
   * 将生成的publicPath写入到本地的配置文件夹
   */
  writePublicPath(): boolean {
    console.log('正在将环境变量写入到.env文件中')
    // 读取项目中原有的.env文件，并且存储在一个变量中
    const envConf = this.envConf;
  
    const envPath = path.resolve(process.cwd(), '.env')
    
    const fileResultStr = Object.keys(envConf).reduce((str, key) => {
      const shouldNoInEnv = ['BUILD_OSS_KEY', 'BUILD_OSS_SECRET', 'BUILD_OSS_BUCKET', 'BUILD_OSS_REGION', 'BUILD_ACCESS_PATH'];
      if(shouldNoInEnv.includes(key)) {
        return str
      }
      return `${str}${key}=${envConf[key]}\n`
    }, '');
  
    try {
      fs.writeFileSync(envPath, fileResultStr, {spaces: '\t'});
      console.log(`${chalk.green('将写入到.env文件中成功！')}`)
      return true
    } catch(e) {
      // 恢复原有的数据
      this.restoreEnvFile()
      console.log(`${chalk.red('PUBLIC_PATH写入到.env文件中失败，请重试！')}`)
      return false
    }
  }

  /**
   * 读取原来的.env文件
   * @returns {(string | null)}
   * @memberof Build
   */
  readEnvFile(): string | null {
    const { encoding } = this.conf;

    const spaasConfigPath = path.resolve(process.cwd(), '.env')
    console.log('正在读取原来的.env文件...')
    try {
      const str = fs.readFileSync(spaasConfigPath, { encoding });
      console.log(`${chalk.green('原有的.env文件读取成功！')}`)
      return str;
    } catch(e) {
      console.log('')
      return null
    }
  }

  /**
   * 恢复原有的env文件
   * @memberof Build
   */
  restoreEnvFile() {
    console.log('正在恢复原有的.env配置...')
    const envPath = path.resolve(process.cwd(), '.env')
    try {
      fs.writeFileSync(envPath, this.beforeBuildEnv, {spaces: '\t'});
      console.log(`${chalk.green('原有的.env配置恢复成功！')}`)
      return true
    } catch(e) {
      console.log(`${chalk.red('原有的.env配置恢复失败，请重试！')}`)
      return false
    }
  }
}