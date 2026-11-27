import { describe, expect, it } from 'vitest';
import { findSecrets, redactSecrets } from '../../src/core/redact.js';

describe('redactSecrets', () => {
  it('replaces credential values but keeps the key name', () => {
    const input = 'API_KEY=abcd1234efgh5678';
    const output = redactSecrets(input);

    expect(output).not.toContain('abcd1234efgh5678');
    expect(output).toContain('API_KEY');
    expect(output).toContain('[REDACTED');
  });

  it('does not flag text that is already redacted', () => {
    const once = redactSecrets('password: hunter2hunter2');

    expect(findSecrets(once)).toEqual([]);
  });
});

describe('findSecrets', () => {
  it('reports the rule and line number without the secret value', () => {
    const findings = findSecrets('first line\nsecret_token = verylongsecretvalue');

    expect(findings).toEqual([{ rule: 'credential-assignment', line: 2 }]);
    expect(JSON.stringify(findings)).not.toContain('verylongsecretvalue');
  });
});
