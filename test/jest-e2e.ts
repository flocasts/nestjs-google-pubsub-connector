/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
    preset: 'ts-jest',
    clearMocks: true,
    moduleFileExtensions: ['js', 'json', 'ts'],
    roots: ['.', '../lib'],
    testEnvironment: 'node',
    testRegex: '.e2e-spec.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
};
