import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PRISMA_QUERY_ENGINE_LIBRARY = path.join(
  process.cwd(),
  'node_modules',
  '@prisma/client',
  'runtime',
  'library.js'
);
