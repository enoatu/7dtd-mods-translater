#!/usr/bin/env zx

$.verbose = true

const targetLangNames = {
  lower: 'japanese',
  upper: 'Japanese',
}

const cacheFile = 'cachefile.js'
const csvParse = require('csv-parse/lib/sync')
const exceptFiles = ['IronBarDoor2x2Block']

const paths = await globby(['./resource/*/Config/Localization.txt'])

paths.forEach((path) => {
  let data = fs.readFileSync(path)
  try {
    data = csvParse(data, {
      columns: false,
      relax_column_count: true,
      skip_lines_with_error: true,
    })
  } catch (e) {
    throw new Error(`${e} ${path} ${data}`)
  }
  const { err, targetLangColumnName, foundTargetLangColumnIndex, lastIndex } =
    getFirstRowInfo(path, data)
  if (err) {
    console.err(err)
    return
  }
  if (foundTargetLangColumnIndex > -1) {
    console.info(
      `${path}, ${targetLangColumnName} (index=${foundTargetLangColumnIndex}) exist. skip`
    )
    return
  }

  console.log(
    data,
    err,
    targetLangColumnName,
    foundTargetLangColumnIndex,
    lastIndex
  )
})

// Get first info
function getFirstRowInfo(path, data) {
  // English check
  const isLower = data[0].indexOf('english') > -1
  const isUpper = data[0].indexOf('English') > -1
  if (!isLower && !isUpper) {
    return {
      err: `${path}, English or english column not found (${data[0]}). skip`,
      targetLangColumnName: null,
      foundTargetLangColumnIndex: -1,
      lastIndex: -1,
    }
  }

  // Target lang check
  const lowerIndex = data[0].indexOf(targetLangNames.lower)
  console.log('low', targetLangNames.lower, lowerIndex)
  const upperIndex = data[0].indexOf(targetLangNames.upper)
  console.log('up', targetLangNames.lower, upperIndex)
  if (lowerIndex > -1) {
    return {
      err: null,
      targetLangColumnName: targetLangNames.lower,
      foundTargetLangColumnIndex: lowerIndex,
      lastIndex: data.length - 1,
    }
  }
  if (upperIndex > -1) {
    return {
      err: null,
      targetLangColumnName: targetLangNames.upper,
      foundTargetLangColumnIndex: upperIndex,
      lastIndex: data.length - 1,
    }
  }

  // Not found target lang
  return {
    err: null,
    targetLangColumnName: isLower
      ? targetLangNames.lower
      : targetLangNames.upper,
    foundTargetLangColumnIndex: -1,
    lastIndex: data.length - 1,
  }
}
