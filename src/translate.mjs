#!/usr/bin/env zx

$.verbose = true

const csvParse = require('csv-parse/lib/sync')
const Config = require('./config')
const Counter = require('./counter')
const TranslateCacher = require('./translate_cacher')
const RequestChunkCreater = require('request_chunk_creater')

const counter = new Counter()
const translateCacher = new TranslateCacher()
const requestChunkCreater = new RequestChunkCreater()

const paths = await globby(['./resource/*/Config/Localization.txt'])

paths.forEach((path) => {
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

  // createTranslateRequest(
  rows.forEach((columns, index) => {
    if (columns.length < 4) {
      // shortest: key,source,english
      return columns
    }
    const source = columns[this.sourceColumnIndex]
    requestChunkCreater.set(`${source}\n\n\n\n\n`)
  })
})

requestChunkCreater.get().forEach(async (chunk) => {
  const formData = new FormData()
  formData.append('text', chunk)
  formData.append('source', Config.sourceLangNames.short)
  formData.append('target', Config.targetLangNames.short)
  const json = await fetch(Config.api.url, {
    method: 'POST',
    body: formData,
  })
  json.text.split(/\\n\\n\\n\\n\\n/).forEach({
    console.log(
  })
})

// translate
// translateCacher.set(columns[sourceColumnIndex], japanew)

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
