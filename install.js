const path = require('path')
const fs = require('fs')
// const Rsync = require('rsync')
const request = require('request')
const unzip = require('unzip')
const unzipper = require('unzipper')
const { https, http } = require('follow-redirects')

// const unzipper = require('node-unzip-2')
const paths = path.dirname(process.execPath).split(path.sep)
paths.push('Localzations.zip')
const localizationsZip = paths.join(path.sep)
console.log(process.execPath, localizationsZip)
const parentDir = path.dirname(process.execPath).split(path.sep).pop()

const DOWNLOAD_URL = 'https://drive.google.com/u/0/uc?id=1YlImR228V1Wo_s-QvNACZkxZ4TTi1yJH&export=download'
console.log(parentDir)
if (parentDir == 'Mods') {
// Build the command
  const outFile = fs.createWriteStream(localizationsZip) // const fileStream = unzipper.Extract({ path: '.' })

  https.get(DOWNLOAD_URL, (res) => {
    if (res.statusCode !== 200) {
      throw new Error(DOWNLOAD_URL + ' ' + res.statusMessage);
    } else {
      console.log(DOWNLOAD_URL + ' is finished downloaded.');
    }
    res.pipe(outFile)
    res.on('finish', function () {
      outFile.close()
    })
    // res.pipe(unzipper.Extract({ path: `${parentDir}/Localizations` }));
   })
  // fileStream.on("finish", function() {
  //   new Rsync()
  //     .flags('vr')
  //     .source('Localizations')
  //     .destination('./Mods')
  //     .execute((err, code, cmd) => {
  //       console.error(err, code, cmd)
  //     })
  // })

} else {
  console.log('Modsフォルダにこの実行ファイルを移動させて、再度実行してください')
}
// URLを指定 
var url = 'http://yoheim.net/image/269.jpg';

// 出力ファイル名を指定
var outFile = fs.createWriteStream('file.jpg');

// ダウンロード開始
var req = http.get(url, function (res) {

    // ダウンロードした内容をそのまま、ファイル書き出し。
    res.pipe(outFile);

    // 終わったらファイルストリームをクローズ。
    res.on('end', function () {
        outFile.close();
    });
});

// エラーがあれば扱う。
req.on('error', function (err) {
    console.log('Error: ', err); return;
});
