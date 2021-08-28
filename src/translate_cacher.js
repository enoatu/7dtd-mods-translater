const Config = require('./config')
const utilString = require('./util/string')

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
  saveFile() {
  }
}
