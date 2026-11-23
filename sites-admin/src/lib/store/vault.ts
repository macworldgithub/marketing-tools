import { openDB, IDBPDatabase } from 'idb';
import { ConnectionConfig } from './types';

const DB_NAME = 'sites_admin_vault';
const DB_VERSION = 1;
const STORE_NAME = 'credentials';
const PBKDF2_ITERATIONS = 600_000;

let inMemoryConfig: ConnectionConfig | null = null;

export function setInMemoryConfig(config: ConnectionConfig): void {
  inMemoryConfig = { ...config };
}

export function getInMemoryConfig(): ConnectionConfig | null {
  return inMemoryConfig ? { ...inMemoryConfig } : null;
}

export function clearInMemoryConfig(): void {
  inMemoryConfig = null;
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM key from a passphrase and salt using PBKDF2 with >= 600k iterations.
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a token using WebCrypto AES-GCM and PBKDF2 derived key.
 */
export async function encryptToken(
  token: string,
  passphrase: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(token)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts a token using WebCrypto AES-GCM and PBKDF2 derived key.
 */
export async function decryptToken(
  encrypted: { ciphertext: string; salt: string; iv: string },
  passphrase: string
): Promise<string> {
  const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv));
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

export interface EncryptedVaultRecord {
  ciphertext: string;
  salt: string;
  iv: string;
  owner: string;
  repo: string;
  branch: string;
  saveMode: 'commit' | 'pr';
}

export async function saveToVault(
  token: string,
  passphrase: string,
  meta: { owner: string; repo: string; branch: string; saveMode: 'commit' | 'pr' }
): Promise<void> {
  const { ciphertext, salt, iv } = await encryptToken(token, passphrase);
  const db = await getDB();
  const record: EncryptedVaultRecord = {
    ciphertext,
    salt,
    iv,
    owner: meta.owner,
    repo: meta.repo,
    branch: meta.branch,
    saveMode: meta.saveMode,
  };
  await db.put(STORE_NAME, record, 'saved_connection');
}

export async function loadFromVault(passphrase: string): Promise<ConnectionConfig | null> {
  const db = await getDB();
  const record = (await db.get(STORE_NAME, 'saved_connection')) as EncryptedVaultRecord | undefined;
  if (!record) return null;

  try {
    const token = await decryptToken(
      { ciphertext: record.ciphertext, salt: record.salt, iv: record.iv },
      passphrase
    );
    const config: ConnectionConfig = {
      owner: record.owner,
      repo: record.repo,
      branch: record.branch,
      token,
      saveMode: record.saveMode || 'commit',
    };
    setInMemoryConfig(config);
    return config;
  } catch (err) {
    throw new Error('Invalid passphrase or corrupted encrypted token.');
  }
}

export async function hasSavedVault(): Promise<boolean> {
  try {
    const db = await getDB();
    const record = await db.get(STORE_NAME, 'saved_connection');
    return Boolean(record);
  } catch {
    return false;
  }
}

export async function clearVault(): Promise<void> {
  clearInMemoryConfig();
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, 'saved_connection');
  } catch {}
}

