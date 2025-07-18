import MyrotvoretsConfig from '@myrotvorets/eslint-config-myrotvorets-ts';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['.tsimp/**', 'dist/**'],
    },
    ...MyrotvoretsConfig,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
];
