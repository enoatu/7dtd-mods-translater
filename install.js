const path = require('path')
const fs = require('fs')
const Rsync = require('rsync')
const unzipper = require('unzipper')
const { https } = require('follow-redirects')

// const unzipper = require('node-unzip-2')
const modsPath = path.dirname(process.execPath)
const dirPath = path.dirname(process.execPath).split(path.sep)
dirPath.push('Localizations')
const localizationsPath = dirPath.join(path.sep)

const parentDir = path.dirname(process.execPath).split(path.sep).pop()

const DOWNLOAD_URL = 'https://drive.google.com/u/0/uc?id=1YlImR228V1Wo_s-QvNACZkxZ4TTi1yJH&export=download'
if (parentDir == 'Mods') {
  https.get(DOWNLOAD_URL, (res) => {
    if (res.statusCode !== 200) {
      throw new Error(DOWNLOAD_URL + ' ' + res.statusMessage);
    } else {
      console.log(DOWNLOAD_URL + ' is finished downloaded.');
    }
    res.pipe(unzipper.Extract({ path: localizationsPath }))
    res.on("end", function() {
      new Rsync()
        .flags('vr')
        .source(localizationsPath + '/')
        .destination(modsPath)
        .execute((err, code, cmd) => {
          if (err) {
            console.error(err, code, cmd)
          }
          process.exit(1)
        })
    })
   })
} else {
  console.log('Modsフォルダにこの実行ファイルを移動させて、再度実行してください')
}
