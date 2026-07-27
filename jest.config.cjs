// Unit tests for pure logic (no React Native runtime). Component tests
// via jest-expo + RNTL are a planned follow-up; the E2E suite covers
// rendered behavior for now.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          types: ['jest', 'node'],
          skipLibCheck: true,
        },
      },
    ],
  },
}
