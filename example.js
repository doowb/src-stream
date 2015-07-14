'use strict';

var through = require('through2');
var src = require('./');

function wrapped (options) {
  return src(plugin(options));
}

function plugin (options) {
  var opts = options || {};
  var stream = through.obj();
  var count = 0;
  var max = opts.max || 10;
  var interval = (typeof opts.interval !== 'undefined' ? opts.interval : 500);
  var name = opts.name || 'default';

  function pad (num, max) {
    var str = '' + num;
    var diff = (str.length - max);
    while (diff < 0) {
      str = ' ' + str;
      diff++;
    }
    return str;
  }

  function write () {
    stream.write('[ ' + name + ' ] { ' + pad(count++, 4) + ' }');
    if (count < max) {
      setTimeout(write, interval);
    } else {
      stream.end();
    }
  }
  process.nextTick(write);

  return stream;
}


src(plugin({name: 'AAA'}))
  .pipe(src(plugin({max: 2, name: 'BBB', interval: 10000})))
  .pipe(wrapped({max: 4, name: 'CCC', interval: 8000}))
  .pipe(src(plugin({max: 8, name: 'DDD', interval: 6000})))
  .pipe(wrapped({max: 16, name: 'EEE', interval: 4000}))
  .pipe(src(plugin({max: 32, name: 'FFF', interval: 2000})))
  .pipe(wrapped({max: 64, name: 'GGG', interval: 1000}))
  .pipe(src(plugin({max: 128, name: 'HHH', interval: 500})))
  .pipe(wrapped({max: 256, name: 'III', interval: 100}))
  .on('data', console.log)
  .on('error', console.error)
  .on('end', console.log.bind(console, 'done'));

