'use strict'

const request = require('request-micro')
const aws4 = require('aws4')
const assert = require('assert')
const encoder = require('aws-form-urlencoded')

module.exports = makeClient

function noOp () {}

function makeClient (options) {
  let context = Object.assign({}, options)
  assert(context.region, 'Region is a required option for SES clients')

  // Configure optional logger
  if ('logger' in context) {
    context.log = context.logger.log.bind(null, 'ses thin client')
    delete context.logger
  } else {
    context.log = noOp
  }

  return {
    sendEmail: sendEmail.bind(null, context)
  }
}

function sendEmail (context, options, callback) {
  let sendResult

  // encodeBody and aws4.sign can both throw before the promise starts
  try {
    context.log('starting send', options)
    sendResult = request(
      aws4.sign({
        service: 'email',
        region: context.region,
        method: 'POST',
        protocol: 'https:',
        path: '/',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: encodeBody(context, options)
      })
    )
  } catch (e) {
    context.log(e)
    sendResult = Promise.reject(e)
  }
  if (!callback) {
    return sendResult.then(result => {
      context.log('finished', result.statusCode, result.statusMessage)
      context.log('data', result.data.toString())
      return result
    })
  }
  sendResult
    .then(result => callback(null, result))
    .catch(error => callback(error))
}

function encodeBody (context, options) {
  context.log('validating params', options)
  validateParams(options)
  context.log('params validated')

  let body = encoder(Object.assign({}, options, { Action: 'SendEmail' }))
  context.log('body encoded', body)
  return body
}

const requiredEmailParams = ['Source', 'Destination', 'Message']

function validateParams (params) {
  requiredEmailParams.forEach(prop =>
    assert(params[prop], `The "${prop}" property is required`)
  )
  assert(params.Message.Body, 'The "Message.Body" property is required')
  assert(params.Message.Subject, 'The "Message.Subject" property is required')
  assert(
    params.Message.Subject.Data,
    'The "Message.Subject.Data" property is required'
  )
  if ('Html' in params.Message.Body) {
    assert(
      params.Message.Body.Html.Data,
      'The "Message.Body.Html.Data" property is required when using Html'
    )
  } else if ('Text' in params.Message.Body) {
    assert(
      params.Message.Body.Text.Data,
      'The "Message.Body.Text.Data" property is required when using Text'
    )
  } else {
    throw new Error('One of "Html", "Text" is required on Message.Body')
  }
}
