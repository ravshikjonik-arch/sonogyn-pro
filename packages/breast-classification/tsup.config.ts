import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  clean: true,
  // Добавляем обработку JSON файлов как ассетов
  // Пути должны быть относительными к tsup.config.ts
  assets: [
    '../../breast-us-reference/02-classifications/data/birads-criteria.json',
    '../../breast-us-reference/03-angiography-doppler/data/doppler-reference.json',
    '../../breast-us-reference/04-elastography/data/elastography-reference.json',
  ],
});