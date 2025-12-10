import { ProcessedUser } from '../types';

const DB_NAME = 'SpectroCloudManager';
const STORE_NAME = 'users';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveUsersToCache = async (users: ProcessedUser[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.clear(); // Clear old data

    users.forEach(user => {
      store.put(user);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const getUsersFromCache = async (): Promise<ProcessedUser[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as ProcessedUser[]);
    request.onerror = () => reject(request.error);
  });
};

export const getLastSyncTime = (): Date | null => {
  const time = localStorage.getItem('spectro_last_sync');
  return time ? new Date(time) : null;
};

export const setLastSyncTime = (date: Date): void => {
  localStorage.setItem('spectro_last_sync', date.toISOString());
};
