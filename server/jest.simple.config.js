module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/simple.test.ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    testTimeout: 5000,
    verbose: true,
};
