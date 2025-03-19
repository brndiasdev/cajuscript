import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import noComments from 'eslint-plugin-no-comments';

const __filename = fileURLToPath( import.meta.url );
const __dirname = dirname( __filename );

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    plugins: {
      'no-comments': noComments
    }
  },
  {
    rules: {
      'space-in-parens': [
        'error',
        'always',
        { exceptions: ['empty', '{}', '()', '[]'] },
      ],
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      curly: ['error', 'all'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      indent: ['error', 2],
      'no-tabs': 'error',
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'object-curly-newline': [
        'error',
        { multiline: true, consistent: true },
      ],
      'eol-last': ['error', 'always'],
      semi: [1, 'always'],
    },
  },
];

export default eslintConfig;
