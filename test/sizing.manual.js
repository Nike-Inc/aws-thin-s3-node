const {FuseBox} = require('fuse-box')

let fuseBox = FuseBox.init({
  cache: false,
  homeDir: `../lib/`,
  output: `build/$name.js`,
  globals: { 'lambda': '*' },
  package: {
    name: 's3',
    main: 's3.js'
  },
  natives: {
    stream: false,
    process: false,
    Buffer: false,
    http: false
  }
})
fuseBox.bundle('s3')
  .instructions(`s3.js`)
  .target('electron')

fuseBox.run()
