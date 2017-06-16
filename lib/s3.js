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
  return util.optionalCallback(context, callback, util.signedRequest(context, {
    method: 'GET',
    path: `/${params.Bucket}/${encodeURIComponent(params.Key)}`
  })
  .then(result => {
    let headers = result.headers
    return {
      Body: result.data,
      DeleteMarker: headers['x-amz-delete-marker'],
      AcceptRanges: headers['accept-ranges'],
      Expiration: headers['x-amz-expiration'],
      Restore: headers['x-amz-restore'],
      LastModified: headers['Last-Modified'],
      ContentLength: headers['Content-Length'],
      ETag: headers['etag'],
      MissingMeta: headers['x-amz-missing-meta'],
      VersionId: headers['x-amz-version-id'],
      CacheControl: headers['Cache-Control'],
      ContentDisposition: headers['Content-Disposition'],
      ContentEncoding: headers['Content-Encoding'],
      ContentLanguage: headers['Content-Language'],
      ContentRange: headers['Content-Range'],
      ContentType: headers['Content-Type'],
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

// GET RESULT

function deleteObject (context, params, callback) {
  return util.optionalCallback(context, callback, util.signedRequest(context, {
    method: 'DELETE',
    path: `/${params.Bucket}/${encodeURIComponent(params.Key)}`
  }).then(result => {
    // context.logger.debug(result.headers, result.statusCode)
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

// This is the  full upload param API, we currently only implement Bucket, Key, Body and ContentType
// var params = {
//   Bucket: 'STRING_VALUE', /* required */
//   Key: 'STRING_VALUE', /* required */
//   ACL: private | public-read | public-read-write | authenticated-read | aws-exec-read | bucket-owner-read | bucket-owner-full-control,
//   Body: new Buffer('...') || 'STRING_VALUE' || streamObject,
//   CacheControl: 'STRING_VALUE',
//   ContentDisposition: 'STRING_VALUE',
//   ContentEncoding: 'STRING_VALUE',
//   ContentLanguage: 'STRING_VALUE',
//   ContentLength: 0,
//   ContentMD5: 'STRING_VALUE',
//   ContentType: 'STRING_VALUE',
//   Expires: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
//   GrantFullControl: 'STRING_VALUE',
//   GrantRead: 'STRING_VALUE',
//   GrantReadACP: 'STRING_VALUE',
//   GrantWriteACP: 'STRING_VALUE',
//   Metadata: {
//     '<MetadataKey>': 'STRING_VALUE',
//     /* '<MetadataKey>': ... */
//   },
//   RequestPayer: requester,
//   SSECustomerAlgorithm: 'STRING_VALUE',
//   SSECustomerKey: new Buffer('...') || 'STRING_VALUE',
//   SSECustomerKeyMD5: 'STRING_VALUE',
//   SSEKMSKeyId: 'STRING_VALUE',
//   ServerSideEncryption: AES256 | aws:kms,
//   StorageClass: STANDARD | REDUCED_REDUNDANCY | STANDARD_IA,
//   Tagging: 'STRING_VALUE',
//   WebsiteRedirectLocation: 'STRING_VALUE'
// }

function putObject (context, params, callback) {
  return util.optionalCallback(context, callback, util.signedRequest(context, {
    method: 'PUT',
    path: `/${params.Bucket}/${encodeURIComponent(params.Key)}`,
    headers: {
      'Content-Type': params.ContentType || 'application/octet-stream'
    },
    body: params.Body
  }).then(result => {
    // context.logger.debug(result.data.toString())
    let headers = result.headers
    return {
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
