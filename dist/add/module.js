"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
class Index {
    constructor(options) {
        this.conf = options || {};
    }
    start() {
        console.log(chalk_1.default.green(`👏 欢迎使用该命令行脚手架`));
    }
}
exports.default = Index;
