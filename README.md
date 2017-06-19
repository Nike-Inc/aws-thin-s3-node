[![NPM version](https://img.shields.io/npm/v/aws-thin-s3.svg)](https://www.npmjs.com/package/aws-thin-s3)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# What is this for?

The [AWS JS SDK](https://github.com/aws/aws-sdk-js) does a lot. For Lambdas is does *too much*; it incurs a 1-2 seconds cold-start time, depending on what you load from it. Even for directly loading the smaller clients, it loads 800kb of code from "core". If you really need to squeeze out that extra performance for Lambda cold-starts, you need a smaller client. This client, with dependencies, is ~15kb. If you are using other thin clients, those dependencies are identical, and share 8kb of the size (its mostly the AWS V4 request signer). This should cost cold-start no more than 100ms, even on the smallest lambda configuration size.

**aws-thin-s3** does not attempt to offer a complete API replacement, but it is a drop-in replacement for the API it does cover. For ease of use the `callback` parameter can be ommitted from all async calls to get a Promise instead.

# Installation

```
npm i aws-thin-s3
```

# API

This thin client is designed for basic file use with S3. It does not support any bucket-level operations, and there are currently no plans to add this. The supported API should be a drop-in replacement for the [Official SDK API](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html), with the addition of promise-returning functions when the callback is ommitted. If you would like to add additional support you can open a Github issue or create a Pull Request.

>***Full API Support*** - This function accepts all input paramaters accepted by the Official SDK, and the response matches the Official SDK exactly. You should be able to replace the thin client with the official client without changing any other code.

>***Partial API Support***- This function accepts some of the input parameters accepted but the Offical SDK, but not all. The response matches the Official SDK, but may not include all properties.

* `getObject` - Full API Support, see [docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property)
* `deleteObject` - Full API Support, see [docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property)
* `putObject` - Partial API Support, input supports `Bucket`, `Key`, `Body` and ContentType; see [docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property)