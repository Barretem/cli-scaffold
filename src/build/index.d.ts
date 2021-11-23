
export interface IBuildConfig {
  type: 'qa' | 'dev',
  configPath: string,
  encoding: string,
}

export interface IBuildOptions {
  type: 'qa' | 'dev',
  encoding?: string,
  ossAccessUrl?: string,
  configPath?: string,
}

export interface IOssConfig {
  'BUILD_OSS_KEY': string,
  'BUILD_OSS_SECRET': string,
  'BUILD_OSS_BUCKET': string,
  'BUILD_OSS_REGION': string
}

export interface ISPaaSBuildConfig extends IOssConfig {
  BUILD_ACCESS_PATH: string,
  UNIQUE_PROJECT_NAME: string,
  [propsName: string]: any
}

export interface IBuildFunc {
  checkConfigFileIfIgnore?: () => Promise<boolean>, // TODO 之后再实现改功能
  asyncReadFileAndFormatConfig: () => ISPaaSBuildConfig | null,
  buildProject: () => Promise<boolean>,
  transportFileToOss: () => Promise<boolean>
  parse: (src: string | Buffer ) => ISPaaSBuildConfig | null
}


export interface IParseOptions {
  /**
   * You may turn on logging to help debug why certain keys or values are not being set as you expect.
   */
}

export interface IParseOutput {
  [name: string]: string;
}

export interface IConfigOptions {
  /**
   * You may specify a custom path if your file containing environment variables is located elsewhere.
   */
  path?: string;

  /**
   * You may specify the encoding of your file containing environment variables.
   */
  encoding?: string;

  /**
   * You may turn on logging to help debug why certain keys or values are not being set as you expect.
   */
  debug?: boolean;
}

/**
 * Loads `.env` file contents into {@link https://nodejs.org/api/process.html#process_process_env | `process.env`}.
 * Example: 'KEY=value' becomes { parsed: { KEY: 'value' } }
 *
 * @param options - controls behavior
 * @returns an object with a `parsed` key if successful or `error` key if an error occurred
 *
 */
export function config(options?: IConfigOptions): ISPaaSBuildConfig;