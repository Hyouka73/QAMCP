import type { AuthCredentials, CredentialReference, ICredentialProvider } from '@qap/auth';

export function getTextContent(result: unknown, index = 0): string {
  if (!result || typeof result !== 'object' || !('content' in result) || !Array.isArray(result.content)) {
    throw new Error('Expected CallToolResult.content to be an array');
  }
  const item = result.content[index] as { type?: unknown; text?: unknown } | undefined;
  if (!item || item.type !== 'text' || typeof item.text !== 'string') {
    throw new Error(`Expected text content at index ${index}`);
  }
  return item.text;
}

export function parseToolResult<T extends Record<string, unknown> = Record<string, unknown>>(
  result: unknown,
  index = 0,
): T {
  return JSON.parse(getTextContent(result, index)) as T;
}

export class TestMemoryCredentialProvider implements ICredentialProvider {
  readonly entries = new Map<string, string>();

  private key(ref: CredentialReference): string {
    return `${ref.projectId}:${ref.applicationId}:${ref.environment}:${ref.auth_profile_id}:${ref.account}`;
  }

  async set(ref: CredentialReference, credentials: AuthCredentials): Promise<void> {
    this.entries.set(this.key(ref), JSON.stringify(credentials));
  }

  async get(ref: CredentialReference): Promise<AuthCredentials | null> {
    const raw = this.entries.get(this.key(ref));
    return raw ? (JSON.parse(raw) as AuthCredentials) : null;
  }

  async delete(ref: CredentialReference): Promise<boolean> {
    return this.entries.delete(this.key(ref));
  }

  close(): void {}
}
