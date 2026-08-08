import { create } from 'zustand'
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import { Transaction, Category, Profile } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// Adaptador para guardar el estado de Zustand en IndexedDB
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

interface FinanceState {
  profile: Profile | null;
  transactions: Transaction[];
  categories: Category[];
  
  // Actions
  setProfile: (profile: Profile | null) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'is_synced'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => void;
  
  // Sync
  markAsSynced: (transactionIds: string[]) => void;
  removeDeletedFromStore: (transactionIds: string[]) => void;
  setHydratedData: (categories: Category[], transactions: Transaction[]) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      profile: null,
      transactions: [],
      categories: [
        // Default categories if none exist
      ],

      setProfile: (profile) => set({ profile }),
      
      addTransaction: (txData) => {
        const newTx: Transaction = {
          ...txData,
          id: uuidv4(),
          created_at: new Date().toISOString(),
          is_synced: false, // Mark as offline initially
        }
        set((state) => ({ transactions: [newTx, ...state.transactions] }))
      },

      updateTransaction: (id, data) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...data, is_synced: false } : tx
          ),
        }))
      },

      deleteTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id)
          if (!tx) return state
          
          if (!tx.is_synced) {
            // Si nunca se subió a la nube, se borra directamente
            return { transactions: state.transactions.filter((t) => t.id !== id) }
          } else {
            // Si ya estaba en la nube, la marcamos para borrado y des-sincronizamos
            return {
              transactions: state.transactions.map((t) =>
                t.id === id ? { ...t, is_deleted: true, is_synced: false } : t
              ),
            }
          }
        })
      },

      removeDeletedFromStore: (transactionIds) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => !transactionIds.includes(tx.id))
        }))
      },

      addCategory: (catData) => {
        const newCat: Category = {
          ...catData,
          id: uuidv4(),
          created_at: new Date().toISOString(),
        }
        set((state) => ({ categories: [...state.categories, newCat] }))
      },

      markAsSynced: (transactionIds) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            transactionIds.includes(tx.id) ? { ...tx, is_synced: true } : tx
          ),
        }))
      },

      setHydratedData: (categories, transactions) => {
        set({ categories, transactions })
      }
    }),
    {
      name: 'finances-storage', // key in IndexedDB
      storage: createJSONStorage(() => idbStorage),
    }
  )
)
