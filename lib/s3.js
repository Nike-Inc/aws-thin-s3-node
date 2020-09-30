'use strict'

const util = require('./util')
const assert = require('assert')

module.exports = makeClient

function makeClient (options) {
  let context = Object.assign({}, options)
  context.logger = util.logWrapper(context.logger)
  assert(context.region, 'Region is a required option for S3 clients')

  return {
    getObject: getObject.bind(null, context),
    putObject: putObject.bind(null, context),
    deleteObject: deleteObject.bind(null, context)
  }
}

function getObject (context, params, callback) {
  assert(params.Bucket, '"Bucket" property is required')
  assert(params.Key, '"Bucket" property is required')
  context.logger.info('starting get request for', params)
  return util.optionalCallback(context, callback, util.signedRequest(context, {
    method: 'GET',
    path: `/${params.Bucket}/${encodeURIComponent(params.Key)}`
  })
  .then(result => {
    context.logger.info('received get resonse for', params)
    let headers = result.headers
    return {
      Body: result.data,
      DeleteMarker: headers['x-amz-delete-marker'],
      AcceptRanges: headers['accept-ranges'],
      Expiration: headers['x-amz-expiration'],
      Restore: headers['x-amz-restore'],
      LastModified: headers['last-modified'],
      ContentLength: headers['content-length'],
      ETag: headers['etag'],
      MissingMeta: headers['x-amz-missing-meta'],
      VersionId: headers['x-amz-version-id'],
      CacheControl: headers['Cache-Control'],
      ContentDisposition: headers['Content-Disposition'],
      ContentEncoding: headers['Content-Encoding'],
      ContentLanguage: headers['Content-Language'],
      ContentRange: headers['Content-Range'],
      ContentType: headers['content-type'],
      Expires: headers['Expires'],
      WebsiteRedirectLocation: headers['x-amz-website-redirect-location'],
      ServerSideEncryption: headers['x-amz-server-side-encryption'],
      Metadata: getMetadata(headers),
      SSECustomerAlgorithm: headers['x-amz-server-side-encryption-customer-algorithm'],
      SSECustomerKeyMD5: headers['x-amz-server-side-encryption-customer-key-MD5'],
      SSEKMSKeyId: headers['x-amz-server-side-encryption-aws-kms-key-id'],
      StorageClass: headers['x-amz-storage-class'],
      RequestCharged: headers['x-amz-request-charged'],
      ReplicationStatus: headers['"x-amz-replication-status'],
      PartsCount: headers['x-amz-mp-parts-count'],
      TagCount: headers['x-amz-tagging-count']
    }
  }))
}

function getMetadata (headers) {
  if (!headers) return undefined
  return Object.keys(headers)
    .filter(h => h.indexOf('x-amz-meta-') === 0)
    .reduce((obj, key) => {
      obj[key] = headers[key]
      return obj
    }, {})
}

function deleteObject (context, params, callback) {
  assert(params.Bucket, '"Bucket" property is required')
  assert(params.Key, '"Bucket" property is required')
  context.logger.info('starting delete request for', params)
  return util.optionalCallback(context, callback, util.signedRequest(context, {
    method: 'DELETE',
    path: `/${params.Bucket}/${encodeURIComponent(params.Key)}`
  }).then(result => {
    context.logger.info('received delete resonse for', params)
    let headers = result.headers
    return {
      DeleteMarker: headers['x-amz-delete-marker']
        ? headers['x-amz-delete-marker'] === 'true' // sent as a string
        : undefined,
      VersionId: headers['x-amz-version-id'],
      RequestCharged: headers['x-amz-request-charged']
    }
  }))
}

function detectContentType (content) {
  if (typeof content === 'string') return 'text/plain'
  if (Buffer.isBuffer(content)) return 'application/octet-stream'
  return 'application/octet-stream'
}

function putObject (context, params, callback) {
  assert(params.Bucket, '"Bucket" property is required')
  assert(params.Key, '"Bucket" property is required')
  context.logger.info('starting put request for', params.Bucket, params.Key)
  let requestParams = {
    method: 'PUT',
    path: `/${params.Bucket}/${encodeURIComponent(params.Key)}`,
    headers: {
      'Content-Type': params.ContentType || detectContentType(params.Body)
    },
    body: params.Body
  }
  if (params.ACL) requestParams.headers['x-amz-acl'] = params.ACL
  return util.optionalCallback(context, callback, util.signedRequest(context, requestParams).then(result => {
    context.logger.info('received put resonse for', params.Bucket, params.Key)
    let headers = result.headers
    return {
      Location: `https://${result.req.getHeaders().host}${result.req.path}`,
      Expiration: headers['x-amz-expiration'],
      Etag: headers['etag'],
      ServerSideEncryption: headers['x-amz-server-side​-encryption'],
      VersionId: headers['x-amz-version-id'],
      SSECustomerAlgorithm: headers['x-amz-server-side​-encryption​-customer-algorithm'],
      SSECustomerKeyMD5: headers['x-amz-server-side​-encryption​-customer-key-MD5'],
      RequestCharged: headers['x-amz-request-charged']
    }
  }))
}
