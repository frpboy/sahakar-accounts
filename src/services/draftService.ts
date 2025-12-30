import { openDB, IDBPDatabase } from 'idb'
import { Draft } from '../types/database'

const DB_NAME = 'sahakar_offline_drafts'
const DB_VERSION = 1
const STORE_NAME = 'drafts'

class DraftService {
  private db: IDBPDatabase | null = null

  async initDB(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('userId', 'userId')
          store.createIndex('outletId', 'outletId')
          store.createIndex('transactionType', 'transactionType')
          store.createIndex('status', 'status')
        }
      },
    })
  }

  async saveDraft(draft: Draft): Promise<void> {
    if (!this.db) await this.initDB()
    
    const draftWithTimestamp = {
      ...draft,
      meta: {
        ...draft.meta,
        lastEditedAt: Date.now()
      }
    }
    
    await this.db!.put(STORE_NAME, draftWithTimestamp)
  }

  async getDrafts(userId: string): Promise<Draft[]> {
    if (!this.db) await this.initDB()
    
    const tx = this.db!.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('userId')
    
    return await index.getAll(userId)
  }

  async getDraft(id: string): Promise<Draft | undefined> {
    if (!this.db) await this.initDB()
    
    return await this.db!.get(STORE_NAME, id)
  }

  async deleteDraft(id: string): Promise<void> {
    if (!this.db) await this.initDB()
    
    await this.db!.delete(STORE_NAME, id)
  }

  async clearDrafts(userId: string): Promise<void> {
    if (!this.db) await this.initDB()
    
    const drafts = await this.getDrafts(userId)
    const tx = this.db!.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    for (const draft of drafts) {
      await store.delete(draft.id)
    }
    
    await tx.done
  }

  async getDraftsByOutlet(outletId: string): Promise<Draft[]> {
    if (!this.db) await this.initDB()
    
    const tx = this.db!.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('outletId')
    
    return await index.getAll(outletId)
  }

  async getDraftsByType(transactionType: string): Promise<Draft[]> {
    if (!this.db) await this.initDB()
    
    const tx = this.db!.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('transactionType')
    
    return await index.getAll(transactionType)
  }

  generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', deviceId)
    }
    return deviceId
  }
}

export const draftService = new DraftService()