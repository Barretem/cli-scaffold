import StartMainApp from './startMainApp';

export default class StartProject {
  public type: string

  constructor(type: string) {
    this.type = type;
  }
  async init() {
    if(this.type === 'main-app') {
      const startMainApp = new StartMainApp();
      await startMainApp.init();
    }
  }
}
