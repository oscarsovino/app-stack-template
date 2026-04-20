import type { ExpoConfig } from "expo/config"

const config: ExpoConfig = {
  name: "App Stack Mobile",
  slug: "app-stack-mobile",
  version: "0.0.1",
  orientation: "portrait",
  scheme: "appstack",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.appstack.mobile",
  },
  android: {
    edgeToEdgeEnabled: true,
    package: "com.appstack.mobile",
  },
  web: {
    bundler: "metro",
    output: "static",
  },
}

export default config
