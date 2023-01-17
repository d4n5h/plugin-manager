const path = require('path')
const fs = require('fs')

class PluginManager {
    /**
     * Calls a new plugin manager
     * @returns {class}
     */
    constructor() {
        this.registry = {}
        this.provide({ pm: this })
    }

    /**
     * Load private plugin directory
     * @param {string} privatePath Absolute path to the plugin directory
     * @returns {promise}
     */
    async loadPrivate(privatePath) {
        return new Promise((resolve, reject) => {
            try {
                const plugins = fs.readdirSync(privatePath)
                if (plugins.length > 0) {
                    for (let i = 0; i < plugins.length; i++) {
                        const pluginName = plugins[i];
                        this.register(path.join(privatePath, pluginName))
                        if (i == plugins.length - 1) resolve(true)
                    }
                } else {
                    resolve(true)
                }
            } catch (error) {
                reject(error)
            }
        })

    }

    /**
     * Load plugins from package.json
     * @param {string} packagePath Absolute path to the package.json
     * @returns {promise}
     */
    async load(packagePath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(packagePath)) throw 'Package file doesn\'t exist'
                const pkg = require(packagePath),
                    names = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]
                if (names.length > 0) {
                    for (let i = 0; i < names.length; i++) {
                        const name = names[i],
                            pkgPath = require.resolve(name),
                            pgkDir = path.dirname(pkgPath),
                            jsonPath = path.join(pgkDir, 'package.json');

                        if (fs.existsSync(jsonPath)) {
                            const instance = require(jsonPath)
                            if (instance.plugin) this.register(pgkDir)
                        }
                        if (i == names.length - 1) resolve(true)
                    }
                } else {
                    resolve(true)
                }
            } catch (error) {
                reject("Unable to load dependencies from " + packagePath + ":" + error)
            }
        })
    }

    /**
     * Get plugin by name
     * @param {string} pluginName The plugin's name
     * @returns {any}
     */
    get(pluginName) {
        if (!this.registry[pluginName]) throw new Error(`The plugin "'${pluginName}'" isn't defined`)
        return this.registry[pluginName]
    }

    /**
     * Add a provider to the registry
     * @param {object} provider The provider object
     */
    provide(provider) {
        if (typeof provider != 'object' || Array.isArray(provider)) throw new Error('Invalid provider, must be an object')
        this.registry = { ...this.registry, ...provider }
    }

    /**
     * Register a plugin
     * @param {string} pluginPath Absolute path to the plugin's directory
     * @returns {any}
     */
    register(pluginPath) {
        return new Promise((resolve, reject) => {
            try {
                const instance = require(pluginPath),
                    pluginName = path.basename(pluginPath),
                    pluginPackage = require(path.join(pluginPath, 'package.json'))

                let isActive = false;
                if (pluginPackage?.plugin?.active && pluginPackage.plugin.active) {
                    isActive = true;
                } else if (pluginPackage?.plugin && pluginPackage.plugin.active === false) {
                    isActive = false;
                } else {
                    isActive = true;
                }

                if (isActive) {
                    const that = this;
                    const provide = function(provider){
                        if (typeof provider != 'object' || Array.isArray(provider)) throw new Error('Invalid provider, must be an object')
                        if (!that.registry[pluginName]) that.registry[pluginName] = {}
                        that.registry[pluginName] = { ...that.registry[pluginName], ...provider }
                    }
                    if (pluginPackage?.plugin?.consume) {
                        const consume = pluginPackage.plugin.consume
                        if (consume == '*') {
                            instance({ ...this.registry, provide })
                            resolve(true)
                        } else if (Array.isArray(consume)) {
                            const newRegistry = { provide }
                            for (let i = 0; i < consume.length; i++) {
                                const toConsume = consume[i];
                                if (this.registry[toConsume]) {
                                    newRegistry[toConsume] = this.registry[toConsume]
                                } else {
                                    throw new Error(`Can't consume ${toConsume} in plugin ${pluginName}`)
                                }
                            }
                            instance(newRegistry)
                            resolve(true)
                        } else {
                            throw `Consume property is not valid for plugin: ${pluginName}, it must be an array of strings or "*"`
                        }
                    } else {
                        instance(this.registry)
                        resolve(true)
                    }
                } else {
                    resolve(true)
                }
            } catch (error) {
                reject(`Can't register plugin ${pluginName}:${error}`)
            }
        })

    }
}

module.exports = PluginManager