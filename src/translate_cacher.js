const Config = require('./config')
const Keyv = require('keyv')
const { KeyvFile } = require('keyv-file')

class TranslateCacher {
  constructor() {
    this.keyvs = {}
    this.defaultKeyv = new Keyv({
      store: new KeyvFile({
        filename: Config.defaultCacheFile,
        encode: (a) => {
          return JSON.stringify(a, null, ' ')
        },
      }),
    })
  }
  async get(modName, key) {
    if (!this.keyvs[modName]) {
      this.create(modName)
    }
    const value = await this.keyvs[modName].get(key)
    if (value) {
      return value
    }
    return null
  }
  async set(modName, key, value) {
    if (!this.keyvs[modName]) {
      this.create(modName)
    }
    await this.keyvs[modName].set(key, value)
  }
  create(modName) {
    this.keyvs[modName] = new Keyv({
      store: new KeyvFile({
        filename: Config.cacheDir + '/' + modName,
        encode: (a) => {
          return JSON.stringify(a, null, ' ')
        },
      }),
    })
  }
}
module.exports = TranslateCacher
