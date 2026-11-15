// A package named by a shared module (web/src/lib) resolves from this app's
// node_modules, like Metro's disableHierarchicalLookup: one React, and no need for
// web's install.
const path = require('node:path')

const web = path.resolve(__dirname, '../../../web') + path.sep
const app = path.resolve(__dirname, '..')

module.exports = (request, options) => {
  // @legendapp/list has no root export (exports map only); point its root request at
  // the react-native entry, as Metro resolves it with platform extensions.
  if (request === '@legendapp/list') return options.defaultResolver('@legendapp/list/react-native', { ...options, basedir: app })
  const bare = !request.startsWith('.') && !path.isAbsolute(request)
  if (bare && options.basedir.startsWith(web)) return options.defaultResolver(request, { ...options, basedir: app })
  return options.defaultResolver(request, options)
}
