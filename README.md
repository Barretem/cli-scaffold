<h3 align="center">cli-scaffold</h3>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Platform](https://img.shields.io/node/v/@tarojs/cli.svg?style=flat-square)](https://github.com/Barretem/cli-scaffold)
[![GitHub Issues](https://img.shields.io/github/issues/Barretem/cli-scaffold.svg)](https://github.com/Barretem/cli-scaffold/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/Barretem/cli-scaffold.svg)](https://github.com/Barretem/cli-scaffold/pulls)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

---

<p align="center"> 标准的命令行工具脚手架，能够快速像写TS那样写CLI命令行工具
    <br>
</p>

## 📝 目录

1. [简介](#简介)
2. [使用说明](#使用说明)
3. [开发说明](#开发说明)
4. [项目说明](#项目说明)
5. [TODO](#TODO)

## 🧐 简介 <a name = "简介"></a>

命令行工具脚手架，能够快速开发相应的命令行工具，减少配置的烦恼。使得命令行工具的编写变得更加简单。

## 🎈使用说明 <a name = "使用说明"></a>

将代码clone到本地：

```shell
git clone https://github.com/Barretem/cli-scaffold.git
```

## 💭 开发说明 <a name = "开发说明"></a>

```shell
# 进入项目目录
cd cli-scaffold
# 安装相关的依赖
yarn
# 启动项目
yarn dev
# 运行命令行工具
node bin/spaas add module
# 即可运行编写的代码
```

## 🚀 项目说明  <a name = "项目说明"></a>

项目目录

```shell
cli-scaffold
 ┣ bin
 ┃ ┣ spaas # 命令行入口文件
 ┣ src
 ┃ ┣ add
 ┃ ┃ ┗ module.ts # 命令行脚本
 ┃ ┗ utils
 ┃ ┃ ┗ index.ts
 ┣ .babelrc
 ┣ .gitignore
 ┣ .npmignore
 ┣ .npmrc
 ┣ README.md
 ┣ global.d.ts
 ┣ package.json
 ┣ tsconfig.json
 ┣ tslint.json
 ┗ yarn.lock
```

- 需要更改命令行初始命令的话，只需要在package.json中找到bin对象，将`spaas`改掉即可
- 开发新命令的时候，统一在bin目录加上`${初始化命令}-${二级命令}`文件，并且文件头部需要加上`#! /usr/bin/env node`
- 其余的命令逻辑统一在src目录下

## ⛏️ TODO <a name = "TODO"></a>