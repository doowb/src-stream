'use strict';

var through = require('through2');
var assert = require('assert');
var src = require('./');
var fs = require('fs');

describe('src-stream', function () {
  it('should return a new duplex stream', function () {
    var stream = through.obj();
    var actual = src(stream);
    assert.equal(actual.readable, true);
    assert.equal(actual.writable, true);
    assert.equal(typeof actual.on, 'function');
    assert.equal(typeof actual.pipe, 'function');
  });

  it('should work with a "passthrough" stream', function (done) {
    var passthrough = through.obj();
    var stream = src(passthrough);
    stream
      .on('data', function (data) {
        assert.equal(data, 'foo');
      })
      .on('error', done)
      .on('end', function () {
        done();
      });

    passthrough.write('foo');
    passthrough.end();
  });

  it('should work with a readable "plugin"', function (done) {
    var stream = src(plugin(10));
    var sum = 0;
    stream
      .on('data', function (count) {
        sum += count;
      })
      .on('error', console.error)
      .on('end', function () {
        assert.equal(sum, 45);
        done();
      });
  });

  it('should work with multiple readable "plugins"', function (done) {
    var stream = src(plugin(10))
      .pipe(src(plugin(5)));
    var sum = 0;
    stream
      .on('data', function (count) {
        sum += count;
      })
      .on('error', console.error)
      .on('end', function () {
        assert.equal(sum, 55);
        done();
      });
  });

  it('should work with multiple streams doing different things', function (done) {
    var pkg = require('./package.json');
    var counter = src(plugin(10));
    var sum = 0;
    var contents = '';
    fs.createReadStream('./package.json')
      .pipe(counter)
      .on('data', function (data) {
        if (Buffer.isBuffer(data)) {
          contents += data.toString('utf8');
        }
        if (typeof data === 'number')
          sum += data;
      })
      .on('error', console.error)
      .on('end', function () {
        assert.equal(sum, 45);
        assert.deepEqual(JSON.parse(contents), pkg);
        done();
      });
  });

  it('should merge multiple files together', function (done) {
    var idx = fs.readFileSync('./index.js', 'utf8');
    var test = fs.readFileSync('./test.js', 'utf8');
    var contents = '';
    fs.createReadStream('./index.js')
      .pipe(src(fs.createReadStream('./test.js')))
      .on('data', function (data) {
        contents += data.toString('utf8');
      })
      .on('error', console.error)
      .on('end', function () {
        assert.equal(contents, idx + test);
        done();
      });
  });
});

function plugin (max) {
  var stream = through.obj();
  max = max || 10;
  var count = 0;
  function write () {
    if (count < max) {
      stream.write(count++);
      return process.nextTick(write);
    }
    stream.end();
  }
  process.nextTick(write);
  return stream;
}
