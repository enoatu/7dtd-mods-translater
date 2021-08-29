#!/usr/bin/env zx

$.verbose = true

await $`cd $(dirname $0)`
const date = (await $`date +"%Y%m%d%H%M%S"`).stdout.trim()
await $`mkdir ./result-${date} && cp -rf ./resource/* ./result-${date}/`

const csvParse = require('csv-parse/lib/sync')
const csvStringifySync = require('csv-stringify/lib/sync')
const Config = require('./config')
const Counter = require('./counter')
const translateCacher = require('./translate_cacher')
const RequestChunkCreater = require('./request_chunk_creater')

const counter = new Counter()
const requestChunkCreater = new RequestChunkCreater()

const paths = await globby(['./resource/*/Config/Localization.txt'])

for (const [pathIndex, path] of paths.entries()) {
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
    foundTargetLangColumnIndex,
    expectedTargetLangColumnIndex,
  } = getFirstRowInfo(path, rows)
  if (err) {
    console.err(err)
    continue
  }
  if (foundTargetLangColumnIndex > -1) {
    // console.info(
    //   `${path}, ${targetLangColumnName} (index=${foundTargetLangColumnIndex}) exist. skip`
    // )
    counter.add('localzationUnNeedPaths', path)
    continue
  }
  counter.add('localzationNeedPaths', path)

  const resultPath = path.replace('./resource/', `./result-${date}/`)
  rows[0][expectedTargetLangColumnIndex] = targetLangColumnName // add columns (header)

  for (let index = 0; rows.length > index; index++) {
    // adjust column size
    for (let columnIndex = 0; columnIndex < rows[index].length; columnIndex++) {
      if (columnIndex > expectedTargetLangColumnIndex) {
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
    //   rows[index][expectedTargetLangColumnIndex] = 'テスト'
    //   continue
    // }

    const source = rows[index][sourceColumnIndex]
    if (!source) {
      continue
    }
    let cache = await translateCacher.get(source)
    if (cache) {
      // console.log(`use cache ${source} => ${cache}`)
      rows[index][expectedTargetLangColumnIndex] = cache
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
        await translateCacher.set(source, text)
        rows[index][expectedTargetLangColumnIndex] = text
      } else {
        console.err(`bad req => ${json}`)
      }
    }
  }
  const filteredRows = rows.filter(row => !!row)
  console.log(0, filteredRows[0])
  console.log(1, filteredRows[1])
  const csvString = csvStringifySync(filteredRows)
  fs.writeFileSync(resultPath, csvString)

  console.info(`--- end output: ${resultPath} ---`)
}

// requestChunkCreater.get().forEach(async (chunk) => {
//   const texts = json.text.split(/\\n\\n\\n\\n\\n/)
//   delete texts[texts.length - 1] // last
//   console.log('texts:', texts)
//   texts.forEach(text => {
//   })
// })

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
      expectedTargetLangColumnIndex: -1,
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

  // get last lang index
  let expectedTargetLangColumnIndex = rows[0].findIndex(row => !row)
  if (expectedTargetLangColumnIndex == -1) {
    expectedTargetLangColumnIndex = rows[0].length
  }

  if (lowerIndex > -1) {
    return {
      err: null,
      sourceColumnName,
      sourceColumnIndex,
      targetLangColumnName: Config.targetLangNames.lower,
      foundTargetLangColumnIndex: lowerIndex,
      expectedTargetLangColumnIndex,
    }
  }
  if (upperIndex > -1) {
    return {
      err: null,
      sourceColumnName,
      sourceColumnIndex,
      targetLangColumnName: Config.targetLangNames.upper,
      foundTargetLangColumnIndex: upperIndex,
      expectedTargetLangColumnIndex,
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
    expectedTargetLangColumnIndex,
  }
}

function modifyText (text) {
  return text.replaceAll('\\\ n ', '\\n').replaceAll('\\\ n', '\\n')
}
