'use strict'

const co = require('co')
const test = require('blue-tape')
const s3 = require('../lib/s3')
let path = require('path')

const testBucket = 'web-assets.niketech.com'

var log = (...args) => console.log(...args.map(a => require('util').inspect(a, { colors: true, depth: 1 }))) // eslint-disable-line

// Load AWS secrets
let credentialsContents = require('fs').readFileSync(path.join(require('os').homedir(), '.aws', 'credentials')).toString()
let creds = credentialsContents.split('\n').slice(1, 3)
process.env.AWS_ACCESS_KEY = creds[0].split('= ')[1]
process.env.AWS_SECRET_KEY = creds[1].split('= ')[1]
// log('creds', process.env.AWS_ACCESS_KEY, process.env.AWS_SECRET_KEY)

let testFile = require('fs').readFileSync(path.join(__dirname, '../', 'package.json'))

let testLogger = {
  log: log,
  // debug: log,
  error: log,
  warn: log,
  info: log
}

test('client should be able to upload, read, and delete a file', t => {
  let testFileName = 'INTEGRATION_TEST_FILE_DELETE_IF_FOUND.json'
  let client = s3({ logger: testLogger, region: 'us-west-2' })
  return co(function * () {
    let putResult = yield client.putObject({ Bucket: testBucket, Key: testFileName, Body: testFile })
    t.ok(putResult, 'put returned without error')

    let getResult = yield client.getObject({ Bucket: testBucket, Key: testFileName })
    t.equal(testFile.toString(), getResult.Body.toString(), 'get result matches original file')

    let deleteResult = yield client.deleteObject({ Bucket: testBucket, Key: testFileName })
    t.ok(deleteResult, 'delete returned without error')

    try {
      getResult = yield client.getObject({ Bucket: testBucket, Key: testFileName })
      t.fail('get should have failed')
    } catch (e) {
      t.ok(e.toString().match(/Not Found: The specified key does not exist\./i), 'file has been deleted')
    }
  }).catch(e => {
    console.error('error in test', e)
  })
})

// test('get should return a file', t => {
//   let client = s3({ logger: testLogger, region: 'us-west-2' })

//   return co(function * () {
//     let result = yield client.getObject({ Bucket: testBucket, Key: 'index.html' })
//     console.log('result', result.toString())
//   })
// })
