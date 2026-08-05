import type { ConfigContext, ExpoConfig } from 'expo/config'

// Extends app.json. The app is served at the saythrough.com root, so
// EXPO_BASE_URL is left unset (assets resolve from /). It's only set to a
// subpath (e.g. /<repo>) for a github.io project-page deploy; local dev and
// local exports leave it unset too.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
})
