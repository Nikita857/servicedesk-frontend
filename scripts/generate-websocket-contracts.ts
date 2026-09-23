import { readFileSync } from 'node:fs';
import { Parser } from '@asyncapi/parser';
import { compile } from 'json-schema-to-typescript';
import { parseDocument } from 'yaml';

type RecordValue = Record<string, unknown>;
interface Contract {
  asyncapi: string;
  channels: Record<string, {
    address: string;
    'x-stomp-destination': string;
    'x-message-direction': string;
    messages: Record<string, { $ref: string }>;
  }>;
  components: {
    schemas: RecordValue;
    messages: Record<string, { payload: { $ref?: string } }>;
  };
}
const header = '// Generated from backend/contracts/websocket-asyncapi.yml. Do not edit.\n\n';
const compareNames = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => compareNames(a, b)).map(([key, item]) => [key, sorted(item)]));
  }
  return value;
}

function normalizeRefs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeRefs);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === '$ref' && typeof item === 'string'
      ? item.replace('#/components/schemas/', '#/definitions/') : normalizeRefs(item)]));
  }
  return value;
}

function refName(ref: string, prefix: string): string {
  if (!ref.startsWith(prefix)) throw new Error(`Unsupported reference ${ref}`);
  return ref.slice(prefix.length);
}

export async function parseWebSocketContract(path: string): Promise<Contract> {
  const source = readFileSync(path, 'utf8');
  const yaml = parseDocument(source, { uniqueKeys: true });
  if (yaml.errors.length) throw new Error(`${path}: invalid YAML: ${yaml.errors.map(error => error.message).join('; ')}`);
  const { document, diagnostics } = await new Parser().parse(source);
  if (!document) throw new Error(`${path}: invalid AsyncAPI: ${diagnostics.map(diagnostic => diagnostic.message).join('; ')}`);
  const contract = yaml.toJS() as Contract;
  if (contract.asyncapi !== '3.0.0' || !contract.channels || !contract.components?.schemas) {
    throw new Error(`${path}: expected AsyncAPI 3 channels and component schemas`);
  }
  return contract;
}

export async function generateWebSocketContracts(contract: Contract): Promise<Record<string, string>> {
  const schemas = sorted(normalizeRefs(contract.components.schemas)) as RecordValue;
  const root = { type: 'object' as const, properties: {}, definitions: schemas };
  const modelCode = await compile(root as unknown as Parameters<typeof compile>[0], 'WebSocketModels', {
    bannerComment: '',
    additionalProperties: false,
    unreachableDefinitions: true,
    style: { singleQuote: true },
  });

  const directions: Record<string, Record<string, { address: string; payload: string }>> = { client: {}, server: {} };
  for (const [name, channel] of Object.entries(contract.channels).sort(([a], [b]) => compareNames(a, b))) {
    const direction = channel['x-message-direction'];
    if (direction !== 'client' && direction !== 'server') throw new Error(`Channel ${name}: invalid x-message-direction`);
    const address = channel['x-stomp-destination'];
    if (typeof address !== 'string' || address !== channel.address) throw new Error(`Channel ${name}: invalid STOMP destination`);
    const refs = Object.values(channel.messages ?? {}).map(message => refName(message.$ref, '#/components/messages/')).sort();
    if (!refs.length) throw new Error(`Channel ${name}: missing messages`);
    for (const message of refs) if (!contract.components.messages[message]) throw new Error(`Channel ${name}: unknown message ${message}`);
    const payloads = refs.map(message => {
      const payload = contract.components.messages[message].payload;
      return payload.$ref ? refName(payload.$ref, '#/components/schemas/') : 'null';
    });
    directions[direction][name] = { address, payload: payloads.join(' | ') };
  }

  const catalog: string[] = [header, "import type * as Models from './models';", ''];
  for (const direction of ['client', 'server'] as const) {
    const entries = Object.entries(directions[direction]);
    catalog.push(`export const ${direction}Destinations = {`);
    for (const [name, data] of entries) catalog.push(`  ${name}: ${JSON.stringify(data.address)},`);
    catalog.push('} as const;', '');
    catalog.push(`export interface ${direction === 'client' ? 'ClientMessages' : 'ServerMessages'} {`);
    for (const [name, data] of entries) catalog.push(`  ${name}: ${data.payload.split(' | ').map(payload => payload === 'null' ? 'null' : `Models.${payload}`).join(' | ')};`);
    catalog.push('}', '');
  }
  catalog.push('export type ClientChannel = keyof ClientMessages;', 'export type ServerChannel = keyof ServerMessages;', '');
  return {
    'models.ts': header + modelCode.replace(/^export interface WebSocketModels \{\}\n/, '').trim() + '\n',
    'catalog.ts': catalog.join('\n'),
  };
}
