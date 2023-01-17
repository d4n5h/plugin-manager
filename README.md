# plugin-manager

Simple plugin manager for NodeJS

## Installation

```bash
npm i @d4n5h/plugin-manager
```

or

```bash
yarn add @d4n5h/plugin-manager
```

## How to use

```javascript
const PluginManager = require('@danisl99/plugin-manager')
const pm = new PluginManager();
const path = require('path')

async function main() {
    // Register some providers
    pm.provide({
        logger: (str) => {
            console.log('Logger:', str)
        },
        example: 123,
        anotherProvider: {
            test: 321
        }
    })

    // Load plugins from package.json (Use absolute path)
    await pm.load(path.join(__dirname, 'package.json'))

    // Load a private plugins directory
    await pm.loadPrivate(path.join(__dirname, 'plugins'));

    // Load a single plugin
    // await pm.register(path.join(__dirname, './plugins/test-plugin'))


    // Use plugins
    pm.get('test-plugin').test('123')
    pm.get('test-plugin').Test.test()

}

main();

```

## Create a plugin

A plugin is basically a node module, but you need to add a "plugin" property in its package.json file in order for the loader to be able to load it properly.

```json

{
  "name": "test-plugin",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
  },
  "author": "",
  "license": "ISC",
  "plugin": {
    "active": true,
    "consume": "*",
    "priority": 0
  }
}
```

1. "active" property (optional): true = active || false = not active || not set = active
2. "consume" property: "*" = consume all the registry || array of plugin names to consume like ["logger", "other-plugin-name"]
3. "priority" property (optional): lowest number (0) will be called before higher numbers

## Plugin code

```javascript
module.exports = ({ provide, logger }) => {
    class Test {
        constructor() {

        }

        test() {
            console.log(123)
        }
    }

    provide({
        test: (str) => {
            console.log('Logger2', str)
        },
        Test: new Test()
    })

    setInterval(() => {
        logger('Used in plugin')
    }, 2000);
}
```
