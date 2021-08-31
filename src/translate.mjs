#!/usr/bin/env zx

$.verbose = true

const csvParse = require('csv-parse/lib/sync')
const csvStringifySync = require('csv-stringify/lib/sync')
const Config = require('./config')

await $`cd $(dirname $0)`
await $`rm -rf ./${Config.outputFileName}`
await $`mkdir ./${Config.outputFileName}`
await $`cp -rf ./resource/* ./${Config.outputFileName}`

const utilsString = require('./utils/string')
const Counter = require('./counter')
const TranslateCacher = require('./translate_cacher')

const counter = new Counter()
const translateCacher = new TranslateCacher()

const paths = await globby([
  './resource/*/config/localization.txt',
  './resource/*/config/Localization.txt',
  './resource/*/Config/Localization.txt',
  './resource/*/Config/localization.txt',
])

for (const [pathIndex, path] of paths.entries()) {
  const modName = path.split('/')[2]
  console.info(`--- start input: ${path} ---`)
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
    targetLangColumnIndex,
    isTranslated,
  } = getFirstRowInfo(path, rows)
  if (err) {
    console.err(err)
    continue
  }
  if (isTranslated) {
    // console.info(
    //   `${path}, ${targetLangColumnName} (index=${foundTargetLangColumnIndex}) exist. skip`
    // )
    counter.add('localzationUnNeedPaths', { path, example: rows[1][targetLangColumnIndex] })
    continue
  }
  counter.add('localzationNeedPaths', path)

  const resultPath = path.replace('./resource/', `./${Config.outputFileName}/`)
  rows[0][targetLangColumnIndex] = targetLangColumnName // add columns (header)

  for (let index = 0; rows.length > index; index++) {
    // adjust column size
    for (let columnIndex = 0; columnIndex < rows[index].length; columnIndex++) {
      if (columnIndex > targetLangColumnIndex) {
        delete rows[index][columnIndex]
      }
    }

    if (index === 0) {
      // key
      continue
    }

    if (rows[index].length < 4) {
      // shortest: key,source,english
      // sometime, comment
      delete rows[index]
      continue
    }

    // for Test
    // if (1 || index > 2) {
    //   rows[index][targetLangColumnIndex] = 'テスト'
    //   continue
    // }

    const source = rows[index][sourceColumnIndex]
    if (!source) {
      continue
    }
    let cache = await translateCacher.get(modName, source)
    if (cache) {
      // console.log(`use cache ${source} => ${cache}`)
      rows[index][targetLangColumnIndex] = cache
      continue
    } else {
      const params = {
        text: source,
        source: Config.sourceLangNames.short,
        target: Config.targetLangNames.short,
      }
      const resp = await fetch(Config.api.url, {
        method: 'POST',
        body: JSON.stringify(params),
      })
      const json = await resp.json()
      if (json.status == 200) {
        const text = modifyText(json.text)
        console.log(text)
        await translateCacher.set(modName, source, text)
        rows[index][targetLangColumnIndex] = text
      } else {
        console.err(`bad req => ${json}`)
      }
    }
  }
  const filteredRows = rows.filter((row) => !!row)
  console.log(0, filteredRows[0])
  console.log(1, filteredRows[1])
  const csvString = csvStringifySync(filteredRows)
  fs.writeFileSync(resultPath, csvString)

  console.info(`--- end output: ${resultPath} ---`)
}

await $`zip ${Config.outputFileName}.zip ${Config.outputFileName}/ && rm -fr ${Config.outputFileName}`

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
      targetLangColumnIndex: -1,
      isTranslated: false,
    }
  }
  const isLower = lowerSourceColumnIndex > -1
  const sourceColumnName = isLower
    ? Config.sourceLangNames.lower
    : Config.sourceLangNames.upper
  const sourceColumnIndex = isLower
    ? lowerSourceColumnIndex
    : upperSourceColumnIndex

  // Target lang check
  const lowerIndex = rows[0].indexOf(Config.targetLangNames.lower)
  const upperIndex = rows[0].indexOf(Config.targetLangNames.upper)

  if (lowerIndex > -1) {
    const isTranslated =
      rows[1] && utilsString.isTranslated(Config.targetLangNames.short, rows[1][lowerIndex]) ||
      rows[2] && utilsString.isTranslated(Config.targetLangNames.short, rows[2][lowerIndex]) ||
      rows[3] && utilsString.isTranslated(Config.targetLangNames.short, rows[3][lowerIndex])
    return {
      err: null,
      sourceColumnName,
      sourceColumnIndex,
      targetLangColumnIndex: lowerIndex,
      targetLangColumnName: Config.targetLangNames.lower,
      isTranslated,
    }
  }
  if (upperIndex > -1) {
    const isTranslated =
      rows[1] && utilsString.isTranslated(Config.targetLangNames.short, rows[1][lowerIndex]) ||
      rows[2] && utilsString.isTranslated(Config.targetLangNames.short, rows[2][lowerIndex]) ||
      rows[3] && utilsString.isTranslated(Config.targetLangNames.short, rows[3][lowerIndex])
    return {
      err: null,
      sourceColumnName,
      sourceColumnIndex,
      targetLangColumnIndex: upperIndex,
      targetLangColumnName: Config.targetLangNames.upper,
      isTranslated,
    }
  }

  // Not found target lang

  // get empty lang index or last lang index
  let targetLangColumnIndex = rows[0].findIndex((row) => !row)
  if (targetLangColumnIndex == -1) {
    targetLangColumnIndex = rows[0].length
  }
  return {
    err: null,
    sourceColumnName,
    sourceColumnIndex,
    targetLangColumnName: isLower
      ? Config.targetLangNames.lower
      : Config.targetLangNames.upper,
    targetLangColumnIndex,
    isTranslated: false,
  }
}

function modifyText(text) {
  return text.replaceAll('\\ n ', '\\n').replaceAll('\\ n', '\\n')
}
