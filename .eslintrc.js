module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint"
    ],
    extends: [
    ],
    rules: {
        'guard-for-in': 'warn',
        '@typescript-eslint/await-thenable': 'warn',
        '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
        'no-fallthrough': 'error',

        "@typescript-eslint/no-misused-promises": "error",
        "no-return-await": "off",
        "@typescript-eslint/return-await": "error",
        "@typescript-eslint/require-array-sort-compare": ["error", {"ignoreStringArrays": true}],
    },
    parserOptions: {
        ecmaVersion: 2020,
        project: './tsconfig.json',
    },
}
