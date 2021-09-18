#!/usr/bin/env zx

$.verbose = true

const Config = require('./config')
const csvParse = require('csv-parse/lib/sync')
const csvStringifySync = require('csv-stringify/lib/sync')
const utilsString = require('./utils/string')
const Counter = require('./counter')
const TranslateCacher = require('./translate_cacher')

const { modname, modversion, useOnlyCache } = argv
if (!Config.modnames.includes(modname)) {
  console.error('undefined modname: ' + modname)
  process.exit(0)
}
if (!modversion) {
  console.error('undefined modversion: ' + modversion)
  process.exit(0)
}
const modDir = `resource/${modname}/${modversion}` // ex) resource/Ravenhearst/a19.6-7.6.1.2
const outputDirName = Config.outputDirName
const tmpOutputDirName = Config.tmpOutputDirName
const outputFile = `7dtd-${modname}-${modversion}` // ex) 7dtd-Ravenhearst-a19.6-7.6.1.2

await $`rm -rf ./${outputDirName}/${outputFile}`   // ex) rm -rf ./output/7dtd-Ravenhearst-a19.6-7.6.1.2
await $`mkdir -p ./${outputDirName}/${outputFile}` // ex) mkdir -p ./output/7dtd-Ravenhearst-a19.6-7.6.1.2
await $`cp -rf ./${modDir}/* ./${outputDirName}/${outputFile}`

const counter = new Counter()
const translateCacher = new TranslateCacher()

const paths = await globby([
  `./${modDir}/*/config/localization.txt`,
  `./${modDir}/*/config/Localization.txt`,
  `./${modDir}/*/Config/Localization.txt`,
  `./${modDir}/*/Config/localization.txt`,
])

for (const [pathIndex, path] of paths.entries()) {
  const modName = path.split('/')[4]
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
    console.error(err)
    continue
  }
  if (isTranslated) {
    // console.info(
    //   `${path}, ${targetLangColumnName} (index=${foundTargetLangColumnIndex}) exist. skip`
    // )
    counter.add('isTranslated', {
      path,
      example1: rows[1][targetLangColumnIndex],
      example2: rows[2][targetLangColumnIndex],
      example3: rows[3][targetLangColumnIndex],
      example4: rows[4][targetLangColumnIndex],
      example5: rows[5][targetLangColumnIndex],
    })
    continue
  }

  const resultPath = path.replace(`./${modDir}/`, `./${outputDirName}/${outputFile}/`)
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

    if (rows[index].length < 2) {
      // shortest: key,english
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
    if (isTranslated) {
      // 抜け確認
      if (utilsString.isTranslated(Config.targetLangNames.short, rows[index][targetLangColumnIndex])) {
        continue
      }
      console.log(`path ${path}: ${Config.sourceLangNames.short} Found`)
    }
    let cache = await translateCacher.get(modName, source)
    if (cache) {
      // console.log(`use cache ${source} => ${cache}`)
      rows[index][targetLangColumnIndex] = cache
      continue
    } else {
      if (useOnlyCache) {
        console.log({ modName, source })
        process.exit(0)
      }
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

// zip compress
await $`cd ${outputDirName} && zip -rq ${outputFile}.zip ${outputFile}/`

await $`mv ./${outputDirName}/${outputFile} ./${tmpOutputDirName}/${outputFile}`

counter.output()

// Get first info
function getFirstRowInfo(path, rows) {
  // Source check
  const lowerSourceColumnIndex = rows[0].indexOf(Config.sourceLangNames.lower)
  const upperSourceColumnIndex = rows[0].indexOf(Config.sourceLangNames.upper)
  const englischSourceColumnIndex = rows[0].indexOf('Englisch')
  let isTranslated = false

  if (
    lowerSourceColumnIndex === -1 &&
    upperSourceColumnIndex === -1 &&
    englischSourceColumnIndex === -1
  ) {
    return {
      err: `${path}, source lang column not found (${rows[0]}). skip`,
      sourceColumnName: null,
      sourceColumnIndex: -1,
      targetLangColumnName: null,
      targetLangColumnIndex: -1,
      isTranslated: false,
    }
  }
  let isLower = lowerSourceColumnIndex > -1
  let sourceColumnName = isLower
    ? Config.sourceLangNames.lower
    : Config.sourceLangNames.upper
  let sourceColumnIndex = isLower
    ? lowerSourceColumnIndex
    : upperSourceColumnIndex

  if (englischSourceColumnIndex > -1) {
    isLower = false
    sourceColumnName = 'Englisch'
    sourceColumnIndex = englischSourceColumnIndex
  }

  // Target lang check
  const lowerIndex = rows[0].indexOf(Config.targetLangNames.lower)
  const upperIndex = rows[0].indexOf(Config.targetLangNames.upper)

  let targetLangColumnIndex = -1

  if (lowerIndex > -1) {
    targetLangColumnIndex = lowerIndex
    isTranslated =
      (rows[1] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[1][lowerIndex]
        )) ||
      (rows[2] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[2][lowerIndex]
        )) ||
      (rows[3] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[3][lowerIndex]
        )) ||
      (rows[4] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[4][lowerIndex]
        )) ||
      (rows[5] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[5][lowerIndex]
        ))
  }
  if (upperIndex > -1) {
    targetLangColumnIndex = upperIndex
    isTranslated =
      (rows[1] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[1][lowerIndex]
        )) ||
      (rows[2] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[2][lowerIndex]
        )) ||
      (rows[3] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[3][lowerIndex]
        )) ||
      (rows[4] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[4][lowerIndex]
        )) ||
      (rows[5] &&
        utilsString.isTranslated(
          Config.targetLangNames.short,
          rows[5][lowerIndex]
        ))
  }

  // Not found target lang

  if (targetLangColumnIndex === -1) {
    // get empty lang index or last lang index
    targetLangColumnIndex = rows[0].findIndex((row) => !row)
    if (targetLangColumnIndex == -1) {
      targetLangColumnIndex = rows[0].length
    }
  }
  return {
    err: null,
    sourceColumnName,
    sourceColumnIndex,
    targetLangColumnName: isLower
      ? Config.targetLangNames.lower
      : Config.targetLangNames.upper,
    targetLangColumnIndex,
    isTranslated,
  }
}

function modifyText(text) {
  return text.replaceAll('\\ n ', '\\n').replaceAll('\\ n', '\\n')
}
