class Counter {
  constructor() {
    this.result = {}
  }
  add(key, value) {
    if (!this.result[key]) this.result[key] = []
    this.result[key].push(value)
  }
  output() {
    Object.keys(this.result).forEach((key) => {
      this.result[`${key}Count`] = this.result[key].length
    })
    console.log('counter', this.result)
  }
}
module.exports = Counter
