const Config = require('./config')
const Keyv = require('keyv')
const { KeyvFile } = require('keyv-file')

const TranslateCacher = new Keyv({
  store: new KeyvFile({
    filename: Config.cacheFile,
    encode: (a) => {
      return JSON.stringify(a, null, ' ')
    },
  }),
})
module.exports = TranslateCacher
