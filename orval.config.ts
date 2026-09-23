import { defineConfig } from 'orval';
import { resolve } from 'node:path';

const contracts = resolve(process.env.BACKEND_CONTRACTS_DIR ?? '../backend/contracts');
const output = resolve(process.env.CONTRACTS_OUTPUT_ROOT ?? '.');

export default defineConfig({
  serviceDesk: {
    input: resolve(contracts, 'openapi.json'),
    output: {
      mode: 'single',
      target: resolve(output, 'lib/api/generated/client.ts'),
      schemas: resolve(output, 'lib/api/generated/models'),
      client: 'axios',
      override: {
        mutator: { path: resolve(output, 'lib/api/mutator.ts'), name: 'customInstance' },
      },
    },
  },
});
