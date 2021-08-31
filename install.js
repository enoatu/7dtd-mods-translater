const path = require('path')
const fs = require('fs')
const Rsync = require('rsync')
const unzipper = require('unzipper')
const { https } = require('follow-redirects')

const parentDir = path.dirname(process.execPath).split(path.sep).pop()
const modsPath = path.dirname(process.execPath)
const dirPath = path.dirname(process.execPath).split(path.sep)
dirPath.push('Localizations')

const localizationsPath = dirPath.join(path.sep)

const DOWNLOAD_URL = 'https://drive.google.com/u/0/uc?id=1YlImR228V1Wo_s-QvNACZkxZ4TTi1yJH&export=download'

if (parentDir == 'Mods') {
  console.log('日本語化されたLocalizationファイルをダウンロード中...')
  https.get(DOWNLOAD_URL, (res) => {
    if (res.statusCode !== 200) {
      throw new Error(DOWNLOAD_URL + ' ' + res.statusMessage)
    }
    console.log('ダウンロードが完了しました')
    console.log('ファイルをsync中...')
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
          fs.unlinkSync(process.execPath)
          fs.rmdirSync(localizationsPath, { recursive: true })
          console.log('日本語化が完了しました！プレイを楽しんで！')
          process.exit(1)
        })
    })
  })
} else {
  console.log('Modsフォルダにこの実行ファイルを移動させて、再度実行してください')
}
