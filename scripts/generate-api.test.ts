import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, expect, it } from 'vitest';

const roots: string[] = [];

function runWithContracts(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'contract-check-'));
  roots.push(root);
  const contracts = join(root, 'contracts');
  const generated = join(root, 'output');
  mkdirSync(contracts);
  mkdirSync(join(generated, 'lib', 'api', 'generated'), { recursive: true });
  writeFileSync(join(generated, 'lib', 'api', 'generated', 'sentinel.ts'), 'original\n');
  for (const [name, content] of Object.entries(files)) writeFileSync(join(contracts, name), content);
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/generate-api.ts'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, BACKEND_CONTRACTS_DIR: contracts, GENERATED_CONTRACTS_ROOT: generated },
  });
  expect(readFileSync(join(generated, 'lib', 'api', 'generated', 'sentinel.ts'), 'utf8')).toBe('original\n');
  expect(readdirSync(join(generated, 'lib', 'api', 'generated'))).toEqual(['sentinel.ts']);
  return result;
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

it('reports missing OpenAPI before writing generated files', () => {
  const result = runWithContracts({});
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('openapi.json');
});

it('reports missing AsyncAPI before writing generated files', () => {
  const result = runWithContracts({ 'openapi.json': '{"openapi":"3.1.0"}' });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('websocket-asyncapi.yml');
});

it('rejects invalid YAML before writing generated files', () => {
  const result = runWithContracts({
    'openapi.json': '{"openapi":"3.1.0","info":{"title":"test","version":"1.0.0"},"paths":{},"components":{"schemas":{}}}',
    'websocket-asyncapi.yml': 'asyncapi: [broken',
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('websocket-asyncapi.yml');
});

it('detects changed generated content without overwriting it', () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-drift-'));
  roots.push(root);
  const contracts = join(root, 'contracts');
  const output = join(root, 'output');
  mkdirSync(contracts);
  writeFileSync(join(contracts, 'openapi.json'), JSON.stringify({
    openapi: '3.1.0', info: { title: 'test', version: '1.0.0' },
    paths: { '/ping': { get: { operationId: 'getPing', responses: { '200': { description: 'ok', content: { 'application/json': { schema: { type: 'string' } } } } } } } },
    components: { schemas: {} },
  }));
  writeFileSync(join(contracts, 'websocket-asyncapi.yml'), `asyncapi: 3.0.0
info: {title: Test, version: 1.0.0}
channels:
  ping:
    address: /topic/ping
    x-stomp-destination: /topic/ping
    x-message-direction: server
    messages: {Ping: {$ref: '#/components/messages/Ping'}}
operations:
  receivePing: {action: send, channel: {$ref: '#/channels/ping'}}
components:
  messages: {Ping: {payload: {$ref: '#/components/schemas/Ping'}}}
  schemas:
    Ping: {type: object, required: [id], properties: {id: {type: integer}}}
`);
  const args = ['node_modules/tsx/dist/cli.mjs', 'scripts/generate-api.ts'];
  const env = { ...process.env, BACKEND_CONTRACTS_DIR: contracts, GENERATED_CONTRACTS_ROOT: output };
  const generate = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8', env });
  expect(generate.status, generate.stderr).toBe(0);
  const client = readFileSync(join(output, 'lib', 'api', 'generated', 'client.ts'), 'utf8');
  expect(client).toContain("from '../mutator'");
  expect(client).toContain('Do not edit manually.');
  const catalog = join(output, 'lib', 'websocket', 'generated', 'catalog.ts');
  writeFileSync(catalog, readFileSync(catalog, 'utf8') + '// hand edit\n');
  const check = spawnSync(process.execPath, [...args, '--check'], { cwd: process.cwd(), encoding: 'utf8', env });
  expect(check.status).not.toBe(0);
  expect(check.stderr).toContain('catalog.ts');
  expect(readFileSync(catalog, 'utf8')).toContain('// hand edit\n');
});
