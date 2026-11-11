import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Our statistics tests run in Node.js.
    // No browser or React rendering is needed.
    environment: 'node',

    // Only run tests belonging to Component Lab.
    include: [
      'src/services/scatterStatistics.test.js',
      'src/services/scatterInsights.test.js',
      'src/services/componentLabApi.test.js',
    ],
  },
})