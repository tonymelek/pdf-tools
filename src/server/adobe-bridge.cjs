// CommonJS bridge — .cjs so Node loads these under root "type": "module".
const catalog = require('./lib/adobe/catalog.cjs')
const client = require('./lib/adobe/client.cjs')
const operations = require('./lib/adobe/operations.cjs')

module.exports = {
  ...catalog,
  ...client,
  ...operations,
}
