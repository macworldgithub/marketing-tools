import { describe, it, expect, beforeEach } from 'vitest';
import { encryptToken, decryptToken, setInMemoryConfig, getInMemoryConfig, clearInMemoryConfig } from './vault';
import { ConnectionConfig } from './types';

describe('Token Vault & WebCrypto AES-GCM', () => {
  beforeEach(() => {
    clearInMemoryConfig();
  });

  it('manages in-memory token and config cleanly', () => {
    expect(getInMemoryConfig()).toBeNull();
    const config: ConnectionConfig = {
      owner: 'test-owner',
      repo: 'test-repo',
      branch: 'main',
      token: 'github_pat_12345',
      saveMode: 'commit',
    };
    setInMemoryConfig(config);
    expect(getInMemoryConfig()).toEqual(config);
    clearInMemoryConfig();
    expect(getInMemoryConfig()).toBeNull();
  });

  it('encrypts and decrypts tokens deterministically with PBKDF2 passphrase', async () => {
    const token = 'github_pat_secret_token_abcdef123456';
    const passphrase = 'SuperSecurePassphrase123!';

    const encrypted = await encryptToken(token, passphrase);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.iv).toBeDefined();

    // Verify ciphertext is not plaintext
    expect(encrypted.ciphertext).not.toContain(token);

    const decrypted = await decryptToken(encrypted, passphrase);
    expect(decrypted).toBe(token);
  });

  it('fails decryption with wrong passphrase', async () => {
    const token = 'my-token';
    const encrypted = await encryptToken(token, 'correct-passphrase');

    await expect(decryptToken(encrypted, 'wrong-passphrase')).rejects.toThrow();
  });
});

