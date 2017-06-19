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

# Using the logger

The client allows a logger to be passed into the constructor that will log at various levels, allowing the consumer to control where and how much logging this module produces. The logger supports 4 optional properties: `debug`, `info`, `warn`, and `error`. Only the provided functions will be used.

* ***Debug*** - The noisiest level. Produces frequent logs which may include sensitive information like full HTTP(s) responses. This is not safe for production.
* ***Info*** - Standard information about module actions; does not log response data but does log input parameters. This should be safe for production unless requests are sensitive.
* ***Warn*** - Indicates a non-fatal error or condition that may require attention. Recommended for production.
* ***Error*** - Fatal errors, does not log response data but will log input parameters.

## Example Logger 

```
let exampleLogger = {
  debug: (...args) => console.log(...args.map(a => require('util').inspect(a, { colors: true, depth: null }))), // eslint-disable-line
  error: (...args) => {
    // do something special
    console.error('yo, something broke', ...args)
  },
  // warn: console.log.bind(console)
  info: console.log.bind(console)
}
let client = s3({ logger: exampleLogger, region: 'us-west-2' })
```

This logger will log teriminal-friendly debug messages, erros, and info, but no warnings.