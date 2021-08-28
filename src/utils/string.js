const isJapanese = () => {
  let gmi = 'gmi'
  let regeIncludeHiragana = '^(?=.*[\u3041-\u3096]).*$'
  let regeIncludeKatakana = '^(?=.*[\u30A1-\u30FA]).*$'
  let regeIncludeKanji = '^(?=.*[\u4E00-\u9FFF]).*$'
  let regeHiragana = new RegExp(regeIncludeHiragana, gmi)
  let regeKatakana = new RegExp(regeIncludeKatakana, gmi)
  let regeKanji = new RegExp(regeIncludeKanji, gmi)

  if (regeHiragana.test(text) || regeKatakana.test(text) || regeKanji.test(text)) {
    return true
  }
  return false
}
module.exports = {
  isJapanese,
}
