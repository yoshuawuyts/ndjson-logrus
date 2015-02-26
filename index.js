var combiner = require('stream-combiner')
var through2 = require('through2')
var chalk = require('chalk')
var split = require('split')

module.exports = logrus
module.exports.createStream = logrus

var poolCount = 0
var poolIndex = {}
var pool = [
  'magenta',
  'cyan',
  'blue',
  'green',
  'yellow'
]

var levels = {
  error: 'red',
  warn: 'yellow',
  debug: 'cyan',
  info: 'blue'
}

const levelMap = {
  error: 'FATA',
  warn: 'WARN',
  debug: 'DBUG',
  info: 'INFO'
}

const epoch = Date.now()
var longest = 0

function logrus (opts) {
  opts = opts || {}

  return combiner(split(), through2.obj(write))

  function safeparse (data) {
    try {
      data = JSON.parse(data)
    } catch(e) { }
    return data
  }

  function write (data, _, next) {
    data = safeparse(data)
    if (typeof data !== 'object') {
      this.push(data)
      this.push('\n')
      return next()
    }

    var level = levels[data.level] || 'yellow'
    var name = data.name ? data.name.replace(/\:[-:\w]{8,}$/g, '') : ''
    var nameColor = poolIndex[name] || (
      poolIndex[name] = pool[poolCount++ % pool.length]
    )
    longest = data.name.length > longest ? data.name.length : longest
    const now = new Date(data.time)
    delete data.time

    const lev = chalk[level](levelMap[data.level])
    delete data.level

    const time = '[' + numPad((~~((now.getTime() - epoch) / 100)) % 10000) + ']'
    const nom = '[' + data.name + ']'
    delete data.name

    const line = [lev + time, nom]

    if (data.message) {
      line.push(data.message)
    } else if (data.req) {
      var req = data.req
      line.push(chalk.bold(req.method))
      line.push(chalk.green(req.url))
    } else if (data.err) {
      line.push(data.err.stack)
    } else {
      line.push(JSON.stringify(data, null, 2))
    }

    delete data.message
    delete data.pid
    delete data.hostname
    const keys = Object.keys(data).map(prettyKeys(data))
    line.push(keys)

    this.push(line.join(' '))
    this.push('\n')

    next()
  }
}

function pad (str, n) {
  str = String(str)
  while (str.length < n) {
    str = ' ' + str
  }
  return str
}

function numPad (num) {
  num = String(num)
  while (num.length < 4) {
    num = '0' + num
  }
  return num
}

// prettyify keys of an object
function prettyKeys(obj) {
  return function map(key) {
    const val = obj[key]
    return key + '=' + (typeof val == 'string' ? "\"" + val + "\"" : val)
  }
}
