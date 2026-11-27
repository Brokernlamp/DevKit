interface SecretRule {
  name: string;
  pattern: RegExp;
  replacement: string;
}

// High-confidence patterns only. Each one keeps the surrounding context
// and replaces just the secret value.
const SECRET_RULES: readonly SecretRule[] = [
  {
    name: 'private-key',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
    replacement: '[REDACTED private key]',
  },
  {
    name: 'aws-access-key',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: '[REDACTED aws key]',
  },
  {
    name: 'github-token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
    replacement: '[REDACTED github token]',
  },
  {
    name: 'slack-token',
    pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
    replacement: '[REDACTED slack token]',
  },
  {
    name: 'stripe-key',
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    replacement: '[REDACTED stripe key]',
  },
  {
    name: 'jwt',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    replacement: '[REDACTED jwt]',
  },
  {
    name: 'credential-assignment',
    pattern:
      /\b([A-Za-z0-9_-]*(?:secret|token|password|passwd|api[_-]?key|private[_-]?key)[A-Za-z0-9_-]*)(\s*[:=]\s*)["'`]?(?!\[REDACTED)[^\s"'`,;]{8,}["'`]?/gi,
    replacement: '$1$2[REDACTED]',
  },
];

export interface SecretFinding {
  rule: string;
  line: number;
}

// Reports where secrets were found, without the matched text.
export function findSecrets(text: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  text.split('\n').forEach((line, index) => {
    for (const rule of SECRET_RULES) {
      if (line.search(rule.pattern) !== -1) {
        findings.push({ rule: rule.name, line: index + 1 });
      }
    }
  });
  return findings;
}

export function redactSecrets(text: string): string {
  return SECRET_RULES.reduce((result, rule) => result.replace(rule.pattern, rule.replacement), text);
}
