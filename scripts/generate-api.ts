import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, cpSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import SwaggerParser from '@apidevtools/swagger-parser';
import { generateWebSocketContracts, parseWebSocketContract } from './generate-websocket-contracts';

const root = resolve(process.env.GENERATED_CONTRACTS_ROOT ?? '.');
const contracts = resolve(process.env.BACKEND_CONTRACTS_DIR ?? '../backend/contracts');
const targets = ['lib/api/generated', 'lib/websocket/generated'];

function files(dir: string): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  if (!existsSync(dir)) return entries;
  function walk(path: string) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) walk(full);
      else entries.set(relative(dir, full).replaceAll('\\', '/'), readFileSync(full));
    }
  }
  walk(dir);
  return entries;
}

async function main() {
  const openapiPath = join(contracts, 'openapi.json');
  const asyncapiPath = join(contracts, 'websocket-asyncapi.yml');
  for (const path of [openapiPath, asyncapiPath]) if (!existsSync(path)) throw new Error(`Missing contract source: ${path}`);

  let openapi: Record<string, unknown>;
  try { openapi = JSON.parse(readFileSync(openapiPath, 'utf8')); }
  catch (error) { throw new Error(`${openapiPath}: invalid JSON: ${String(error)}`); }
  if (typeof openapi.openapi !== 'string' || !openapi.openapi.startsWith('3.') || !openapi.paths || !openapi.components) throw new Error(`${openapiPath}: invalid OpenAPI document`);
  await SwaggerParser.validate(openapi as unknown as Parameters<typeof SwaggerParser.validate>[0]);
  const websocket = await parseWebSocketContract(asyncapiPath);
  const wsFiles = await generateWebSocketContracts(websocket);

  const temporary = mkdtempSync(join(tmpdir(), 'generated-contracts-'));
  try {
    const wsDir = join(temporary, 'lib/websocket/generated');
    mkdirSync(wsDir, { recursive: true });
    for (const [name, content] of Object.entries(wsFiles)) writeFileSync(join(wsDir, name), content);
    mkdirSync(join(temporary, 'lib/api'), { recursive: true });
    cpSync(resolve('lib/api/mutator.ts'), join(temporary, 'lib/api/mutator.ts'));
    const orval = resolve('node_modules/orval/dist/bin/orval.mjs');
    const result = spawnSync(process.execPath, [orval, '--config', resolve('orval.config.ts')], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, BACKEND_CONTRACTS_DIR: contracts, CONTRACTS_OUTPUT_ROOT: temporary },
    });
    if (result.status !== 0) throw new Error(`Orval generation failed:\n${result.stdout}\n${result.stderr}`);
    for (const target of targets) {
      const actual = files(join(root, target));
      const expected = files(join(temporary, target));
      if (!expected.size) throw new Error(`Generator produced no files in ${target}`);
      if (process.argv.includes('--check')) {
        const names = new Set([...actual.keys(), ...expected.keys()]);
        const drift = [...names].filter(name => !actual.has(name) || !expected.has(name) || !actual.get(name)!.equals(expected.get(name)!));
        if (drift.length) throw new Error(`Generated output differs in ${target}: ${drift.join(', ')}`);
      } else {
        const destination = join(root, target);
        rmSync(destination, { recursive: true, force: true });
        mkdirSync(destination, { recursive: true });
        cpSync(join(temporary, target), destination, { recursive: true });
      }
    }
    console.log(process.argv.includes('--check') ? 'Generated contracts match checked-in output.' : 'Generated API contracts.');
  } finally { rmSync(temporary, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
