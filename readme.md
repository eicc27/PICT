# PICT - Pixiv Integrated Crawling Toolset

[toc]

## Current Progress

Refining the robustness. Training SRGAN.

## Content

- PixCrawl core
  - Python
  - Node
- Customized file manager
- IRIS experimental enhancement toolset
  - Super Resolution Solution

## Arch

Front-end(`ember.js`) & back-end(`koa2 with ts`), localhost application

**port: 3000, 4200**

*Note: backend uses 2 types of protocols: HTTP & WebSocket. They share a same port.*

## Initialization - npm modules

### Using auto-starter

Make sure you are in the PICT root directory, run:

- Windows: `./starter/windows/start-pict.ps1`. This will evoke Windows Terminal(make sure you have it), and try to run front and back in one single window but two different pages.
- Linux: `./starter/liunux/start-pict.sh`. This will start front and back in your default shell, and make them daemon(`nohup`).

### Common

To install the NPM Modules preconfigured, change directory into `/back` and `/front`, respectively, run:

`npm i`

### Back

Change into `/back` and run:

`npm run dev`

If a test application is needed, make a `/back/test` directory and put a `test.ts` in. Run:

`npm run test`

### Front

To run the `ember.js` project, a global ember configuration is suggested:

`(sudo) npm install -g ember`

After installation, change into `/front` directory and run:

`ember serve`

## Technical Overview

This provides an overview of crawling progress, showing the data flow control inside.

![img](./readme-src/back.svg)
