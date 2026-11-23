import { ContentStore, ConnectionConfig } from './types';
import { GitHubStore } from './github-store';
import { MockStore } from './mock-store';
import { getInMemoryConfig } from './vault';

let activeStore: ContentStore | null = null;

export function getActiveStore(): ContentStore | null {
  if (activeStore) return activeStore;
  const config = getInMemoryConfig();
  if (config && config.token) {
    activeStore = new GitHubStore(config);
    return activeStore;
  }
  if (typeof window !== 'undefined') {
    if (localStorage.getItem('use_mock_store') === 'true') {
      activeStore = new MockStore();
      return activeStore;
    }
  }
  return null;
}

export function setActiveStore(store: ContentStore | null): void {
  activeStore = store;
}

export function createStoreFromConfig(config: ConnectionConfig): ContentStore {
  const store = new GitHubStore(config);
  activeStore = store;
  return store;
}

export { MockStore } from './mock-store';
export { GitHubStore } from './github-store';
export * from './types';
export * from './vault';
export * from './pending';

