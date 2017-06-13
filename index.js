'use strict'

const request = require('request-micro')
const aws4 = require('aws4')
const assert = require('assert')

module.exports = makeClient

const noop = () => {}
const functionElseNoop = (func) => {
  if (func && typeof func === 'function') {
    return func
  }
  return noop
}
function logWrapper (loggerArg) {
  const logger = loggerArg || {}
  return {
    log: functionElseNoop(logger.log),
    error: functionElseNoop(logger.error),
    warn: functionElseNoop(logger.warn),
    info: functionElseNoop(logger.info),
    debug: functionElseNoop(logger.debug)
  }
}

function makeClient (options) {
  let context = Object.assign({}, options)
  context.logger = logWrapper(options.logger)

  return {
    getObject: getObject.bind(null, context),
    // putObject: putObject.bind(null, context),
    deleteObject: deleteObject.bind(null, context)
  }
}

function optionalCallback (context, action, callback) {
  let sendResult

  // encodeBody and aws4.sign can both throw before the promise starts
  try {
    context.log('starting send')
    sendResult = action()
  } catch (e) {
    context.error(e)
    sendResult = Promise.reject(e)
  }
  if (!callback) {
    return sendResult.then(result => {
      context.log('finished', result.statusCode, result.statusMessage)
      return result
    })
  }
  sendResult
    .then(result => callback(null, result))
    .catch(error => callback(error))
}

function getObject (context, params, callback) {
  return optionalCallback(context, () => request(
    aws4.sign({
      service: 'email',
      host: `${params.Bucket}}.s3.amazonaws.com`,
      method: 'GET',
      protocol: 'https:',
      path: '/' + encodeURIComponent(params.Key)
    })
  ), callback)
}

function deleteObject (context, params, callback) {
  return optionalCallback(context, () => request(
    aws4.sign({
      service: 'email',
      host: `${params.Bucket}}.s3.amazonaws.com`,
      method: 'DELETE',
      protocol: 'https:',
      path: '/' + encodeURIComponent(params.Key)
    })
  ), callback)
}

function putObject (context, params) {
  /*
  {
  Body: <Binary String>,
  Bucket: "examplebucket",
  Key: "exampleobject"
 }
 */
  // TODO: implement upload
}
