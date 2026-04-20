// Metro configuration for pnpm monorepo.
// Watches the entire workspace so HMR picks up changes in @app-stack/* packages,
// and resolves deps from both the app and workspace-root node_modules.

const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]

// pnpm: do not climb the directory tree looking for hoisted deps.
config.resolver.disableHierarchicalLookup = true

module.exports = config
