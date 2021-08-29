const Config = require('./config')
const utilString = require('./utils/string')
const csvStringifySync = require('csv-stringify/lib/sync')

class TranslateCacher {
  constructor() {
    this.result = {}
  }
  set(key, value) {
    this.result[key] = value
  }
  get(key) {
    return this.result[key]
  }
  saveFile() {
    const array = []
    console.log(this.result)
    Object.keys(this.result).forEach((key) => {
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
