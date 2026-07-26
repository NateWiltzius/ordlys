import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import unicornPlugin from 'eslint-plugin-unicorn';

export default tseslint.config(
  {
    ignores: ['.next/', 'dist/', 'node_modules/', 'next-env.d.ts'],
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,mts,cts,tsx,mtsx}'],
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      unicorn: unicornPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
    },
  },
  ...tseslint.configs.strict,
  prettierRecommended,
);
