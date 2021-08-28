#!/usr/bin/env zx

$.verbose = true

await $`cd $(dirname $0)`
const date = (await $`date +"%Y%m%d%H%M%S"`).stdout.trim()
console.log(date)
await $`mkdir ./result-${date} && cp -rf ./resource ./result-${date}`

const csvParse = require('csv-parse/lib/sync')
const csvStringifySync = require("csv-stringify/lib/sync");
const Config = require('./config')
const Counter = require('./counter')
const TranslateCacher = require('./translate_cacher')
const RequestChunkCreater = require('./request_chunk_creater')

const counter = new Counter()
const translateCacher = new TranslateCacher()
const requestChunkCreater = new RequestChunkCreater()

const paths = await globby(['./resource/*/Config/Localization.txt'])

paths.forEach((path, index) => {
  if (index > 3) return
  // parse
  let rows = fs.readFileSync(path)
  rows = csvParse(rows, {
    columns: false,
    relax_column_count: true,
    skip_lines_with_error: true,
  })

  // getinfo
  const {
    err,
    sourceColumnName,
    sourceColumnIndex,
    targetLangColumnName,
    foundTargetLangColumnIndex,
    lastIndex,
  } = getFirstRowInfo(path, rows)
  if (err) {
    console.err(err)
    return
  }
  if (foundTargetLangColumnIndex > -1) {
    // console.info(
    //   `${path}, ${targetLangColumnName} (index=${foundTargetLangColumnIndex}) exist. skip`
    // )
    counter.add('localzationUnNeedPaths', path)
    return
  }
  counter.add('localzationNeedPaths', path)

  let isNeedWriteFile = false
  // createTranslateRequest(
  const resultPath = path.replace('./resource/', `./result-${date}`)
  rows[0][lastIndex + 1] = targetLangColumnName // add columns (header)
  rows.forEach(async (columns, index) => {
    if (columns.length < 4) {
      // shortest: key,source,english
      return columns
    }
    const source = columns[sourceColumnIndex]
    // let result = translateCacher.get(source)
    if (0) {
      // result
    } else {
      // requestChunkCreater.set(`${source}\n\n\n\n\n`)
      const params = {
        text: source,
        source: Config.sourceLangNames.short,
        target: Config.targetLangNames.short,
      }
      const resp = await fetch(Config.api.url, {
        method: 'POST',
        body: JSON.stringify(params),
        headers:{
          "Content-Type": "application/json"
        }
      })
      const json = await resp.json()
      process.exit(1)
      if (json.status === 200) {
        result = json.text
        translateCacher.set(source, json.text)
      } else {
        throw new Error(json)
      }
    }
  })
  // if (isNeedWriteFile) {
  //   const csvString = csvStringifySync(data, {
  //     header: true,
  //   })
  //   console.log('csvstring: ', csvString)
  //   fs.writeFileSync(resultPath, csvString)
  // }
})

// requestChunkCreater.get().forEach(async (chunk) => {
//   const texts = json.text.split(/\\n\\n\\n\\n\\n/)
//   delete texts[texts.length - 1] // last
//   console.log('texts:', texts)
//   texts.forEach(text => {
//   })
// })

// translate

translateCacher.saveFile()
counter.output()

// Get first info
function getFirstRowInfo(path, rows) {
  // Source check
  const lowerSourceColumnIndex = rows[0].indexOf(Config.sourceLangNames.lower)
  const upperSourceColumnIndex = rows[0].indexOf(Config.sourceLangNames.upper)
  if (lowerSourceColumnIndex === -1 && upperSourceColumnIndex === -1) {
    return {
      err: `${path}, source lang column not found (${rows[0]}). skip`,
      sourceColumnName: null,
      sourceColumnIndex: -1,
      targetLangColumnName: null,
      foundTargetLangColumnIndex: -1,
      lastIndex: -1,
    }
  }
  const isLower = lowerSourceColumnIndex > -1
  const sourceColumnName = isLower ? Config.sourceLangNames.lower : Config.sourceLangNames.upper
  const sourceColumnIndex = isLower
    ? lowerSourceColumnIndex
    : upperSourceColumnIndex

  // Target lang check
  const lowerIndex = rows[0].indexOf(Config.targetLangNames.lower)
  const upperIndex = rows[0].indexOf(Config.targetLangNames.upper)
  if (lowerIndex > -1) {
    return {
      err: null,
      sourceColumnName,
      sourceColumnIndex,
      targetLangColumnName: Config.targetLangNames.lower,
      foundTargetLangColumnIndex: lowerIndex,
      lastIndex: rows.length - 1,
    }
  }
  if (upperIndex > -1) {
    return {
      err: null,
      sourceColumnName,
      sourceColumnIndex,
      targetLangColumnName: Config.targetLangNames.upper,
      foundTargetLangColumnIndex: upperIndex,
      lastIndex: rows.length - 1,
    }
  }

  // Not found target lang
  return {
    err: null,
    sourceColumnName,
    sourceColumnIndex,
    targetLangColumnName: isLower
      ? Config.targetLangNames.lower
      : Config.targetLangNames.upper,
    foundTargetLangColumnIndex: -1,
    lastIndex: rows.length - 1,
  }
}
