const Config = require('./config')
const utilString = require('./utils/string')
const csvStringifySync = require("csv-stringify/lib/sync");

class TranslateCacher {
  constructor() {
    this.result = {}
  }
  set(key, value) {
    if (!this.result[key]) {
      this.result[key] = value
    } else {
      // set nearest translated word for optimization
      if (Config.targetLangNames.upper === 'Japanese' && utilString.isJapanese()) {
        this.result[key] = value
      }
    }
  }
  get(key) {
    return this.result[key]
  }
  saveFile() {
    const array = []
    Object.keys(this.result).forEach(key => {
      const touple = []
      touple.push(key)
      touple.push(this.result[key])
      array.push(touple)
    })
    const csvString = csvStringifySync(array, {
      header: true,
    })
    fs.writeFileSync(Config.cacheFile, csvString)
  }
}
module.exports = TranslateCacher
