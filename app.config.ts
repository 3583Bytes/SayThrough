import type { ConfigContext, ExpoConfig } from 'expo/config'

// Extends app.json. EXPO_BASE_URL is set by the GitHub Pages workflow so
// the exported bundle resolves assets under /saythrough/; local dev and
// local exports leave it unset.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
})
