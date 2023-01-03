# PICT - Pixiv Integrated Crawling Toolset

## Current Progress
Largely refactoring the code

## Content

- PixCrawl core
  - Python(`playwright`)
  - Node(`playwright`)
- Customized file manager
- IRIS experimental enhancement toolset
  - IRIS(`TODO`)
    - Python(`matplotlib`)
    - Node(`js`, `hbs`)
  - SRCNN(`TODO`, `python`)

## Arch

Front-end(`ember.js`) & back-end(`koa2 with ts`), localhost application

**port: 3000, 4200**

## Initialization - npm modules

### back

npm init -y

npm install koa koa-router

npm install --save-dev @types/koa @types/koa-router

npm install --save-dev typescript ts-node nodemon

npm install koa-body

npm install @playwright/latest

(tsconfig.json)

### front

(sudo) npm install -g ember

ember init

ember install @ember/render-modifiers
