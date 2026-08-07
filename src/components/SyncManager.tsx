"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useStore'
import { CloudOff, Cloud, RefreshCw } from 'lucide-react'

export default function SyncManager({ session }: { session: any }) {
  const { transactions, categories, markAsSynced } = useFinanceStore()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const unsyncedTransactions = transactions.filter(t => !t.is_synced)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    // Auto-sync when online and there are unsynced items
    if (isOnline && unsyncedTransactions.length > 0 && !isSyncing && session?.user?.id) {
      syncData()
    }
  }, [isOnline, unsyncedTransactions.length, session])

  const syncData = async () => {
    if (unsyncedTransactions.length === 0 || !session?.user?.id) return
    setIsSyncing(true)

    try {
      // 1. Sync Categories first
      // Push all local categories to remote with upsert to ensure foreign keys exist
      const categoriesToSync = categories.map(c => ({
        id: c.id,
        user_id: session.user.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        is_system: c.is_system
      }))
      
      if (categoriesToSync.length > 0) {
        await supabase.from('categories').upsert(categoriesToSync)
      }

      // 2. Sync Transactions
      const txsToSync = unsyncedTransactions.map(t => ({
        id: t.id,
        user_id: session.user.id,
        category_id: t.category_id,
        amount: t.amount,
        date: t.date,
        description: t.description,
        type: t.type,
        is_synced: true // We set it to true for remote
      }))

      const { error } = await supabase.from('transactions').upsert(txsToSync)

      if (error) throw error

      // Mark local as synced
      markAsSynced(unsyncedTransactions.map(t => t.id))

    } catch (error) {
      console.error("Error syncing data:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Floating status indicator
  if (unsyncedTransactions.length === 0 && isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-xs text-gray-400">
        <Cloud size={14} className="text-green-400" /> Sincronizado
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-orange-500/20 backdrop-blur px-3 py-1.5 rounded-full border border-orange-500/30 flex items-center gap-2 text-xs text-orange-400">
        <CloudOff size={14} /> Offline ({unsyncedTransactions.length} pendientes)
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500/20 backdrop-blur px-3 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-2 text-xs text-blue-400">
      <RefreshCw size={14} className="animate-spin" /> Sincronizando...
    </div>
  )
}
