const Config = require('./config')

class RequestChunkCreater {
  constructor() {
    this.chunks = []
    this.index = 0
  }
  set(value) {
    if (this.chunks[this.index].length >= Config.api.maxTextLengthPerReq) {
      // To next chunk
      this.index++
    }
    this.chunks[this.index] += value
  }
  get() {
    return this.chunks
  }
}
module.exports = RequestChunkCreater
