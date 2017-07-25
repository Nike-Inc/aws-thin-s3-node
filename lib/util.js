'use strict'

const request = require('request-micro')
const aws4 = require('aws4')
const util = require('util')

module.exports = {
  logWrapper: logWrapper,
  optionalCallback: optionalCallback,
  formatError: formatError,
  signedRequest: signedRequest
}

function noop () { }
function functionElseNoop (func) {
  if (func && typeof func === 'function') {
    return func
  }
  return noop
}
function logWrapper (loggerArg) {
  const logger = loggerArg || {}
  return {
    error: functionElseNoop(logger.error),
    warn: functionElseNoop(logger.warn),
    info: functionElseNoop(logger.info),
    debug: functionElseNoop(logger.debug)
  }
}

function optionalCallback (context, callback, promise) {
  if (callback === undefined) {
    return new Promise((resolve, reject) => {
      optionalCallback(context, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      }, promise)
    })
  }
  promise
    .then(result => {
      context.logger.debug('done', result)
      callback(null, result)
    })
    .catch(error => callback(error))
}

let xmlErrorRegex = /<Message>(.+?)<\/Message>/
function formatError (context, obj) {
  let message = ''
  if (obj.statusMessage) message += `${obj.statusMessage}: `
  if (obj.data) obj.data = obj.data.toString()
  if (obj.headers && obj.headers['content-type'] === 'application/xml' && xmlErrorRegex.test(obj.data)) message += obj.data.match(xmlErrorRegex)[1]
  if (obj.message) message += obj.message
  if (message === '') message = util.inspect({ message: 'Error', data: obj }, { depth: 1 })
  context.logger.error(message)
  return new Error(message)
}

function signedRequest (context, params) {
  try {
    let defaultParams = {
      service: 's3',
      hostname: `s3-${context.region}.amazonaws.com`,
      region: context.region,
      protocol: 'https:'
    }
    return request(aws4.sign(Object.assign(defaultParams, params))).then(result => {
      context.logger.info('response status', result.statusCode)
      context.logger.debug('response headers', result.headers)
      if (result.statusCode >= 400) throw formatError(context, result)
      return result
    })
  } catch (e) {
    return Promise.reject(e)
  }
}
