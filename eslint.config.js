import js from '@eslint/js'
import ts from 'typescript-eslint'

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    rules: {
      // Параметр с подчёркиванием — осознанно неиспользуемый (например, в базовых методах Scene).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Граница SDK → игра, проверяемая машиной, а не только обещанием в README.
    // SDK обязан оставаться независимым от конкретной игры.
    files: ['src/sdk/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@sdk', '**/games/**', '../games/*'],
              message:
                'SDK не может зависеть от игры. Передайте нужные данные через параметры или конфиг.',
            },
          ],
        },
      ],
    },
  },
]
