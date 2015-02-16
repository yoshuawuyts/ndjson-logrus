#!/usr/bin/env node

var ndjl = require('./')

var opts = {}
opts.time = (process.argv.indexOf('--time') > -1)

process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin
  .pipe(ndjl(opts))
  .pipe(process.stdout)
