"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useStore'
import { CloudOff, Cloud, RefreshCw, AlertCircle } from 'lucide-react'

export default function SyncManager({ session }: { session: any }) {
  const { transactions, categories, markAsSynced, removeDeletedFromStore, setHydratedData } = useFinanceStore()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const unsyncedTransactions = transactions.filter(t => !t.is_synced && !t.is_deleted)
  const pendingDeletions = transactions.filter(t => t.is_deleted)
  const totalPending = unsyncedTransactions.length + pendingDeletions.length

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
    if (session?.user?.id && !hasHydrated && isOnline) {
      hydrateData()
    }
  }, [session?.user?.id, hasHydrated, isOnline])

  const hydrateData = async () => {
    if (!session?.user?.id) return
    setIsSyncing(true)
    try {
      const { data: remoteCategories } = await supabase.from('categories').select('*').eq('user_id', session.user.id)
      const { data: remoteTransactions } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).order('date', { ascending: false })
      
      if (remoteCategories && remoteTransactions) {
        const remoteTxIds = new Set(remoteTransactions.map(t => t.id))
        const localUnsyncedTxs = transactions.filter(t => (!t.is_synced || t.is_deleted) && !remoteTxIds.has(t.id))
        
        const remoteCatIds = new Set(remoteCategories.map(c => c.id))
        const localUnsyncedCats = categories.filter(c => !remoteCatIds.has(c.id))

        setHydratedData(
          [...remoteCategories, ...localUnsyncedCats],
          [...(remoteTransactions.map(t => ({...t, is_synced: true}))), ...localUnsyncedTxs]
        )
      }
      setHasHydrated(true)
    } catch (err) {
      console.error("Error al descargar datos:", err)
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    if (isOnline && totalPending > 0 && !isSyncing && session?.user?.id && hasHydrated && !syncError) {
      syncData()
    }
  }, [isOnline, totalPending, session, hasHydrated, isSyncing, syncError])

  const syncData = async () => {
    if (totalPending === 0 || !session?.user?.id) return
    setIsSyncing(true)
    setSyncError(null)

    try {
      // 1. Delete remote transactions
      if (pendingDeletions.length > 0) {
        const deleteIds = pendingDeletions.map(t => t.id)
        const { error: delError } = await supabase.from('transactions').delete().in('id', deleteIds)
        if (delError) throw new Error(`Fallo al eliminar: ${delError.message}`)
        
        removeDeletedFromStore(deleteIds)
      }

      // 2. Sync Categories
      const categoriesToSync = categories.map(c => ({
        id: c.id,
        user_id: session.user.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        is_system: c.is_system
      }))
      
      if (categoriesToSync.length > 0) {
        const { error: catError } = await supabase.from('categories').upsert(categoriesToSync)
        if (catError) throw new Error(`Fallo en categorías: ${catError.message}`)
      }

      // 3. Sync Transactions
      if (unsyncedTransactions.length > 0) {
        const txsToSync = unsyncedTransactions.map(t => ({
          id: t.id,
          user_id: session.user.id,
          category_id: t.category_id,
          amount: t.amount,
          date: t.date,
          description: t.description,
          type: t.type,
          is_synced: true 
        }))

        const { error: txError } = await supabase.from('transactions').upsert(txsToSync)
        if (txError) throw new Error(`Fallo en gastos: ${txError.message}`)

        markAsSynced(unsyncedTransactions.map(t => t.id))
      }
    } catch (err: any) {
      console.error("Error syncing data:", err)
      setSyncError(err.message || "Error desconocido")
    } finally {
      setIsSyncing(false)
    }
  }

  if (syncError) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500/20 backdrop-blur px-3 py-1.5 rounded-full border border-red-500/50 flex items-center gap-2 text-xs text-red-400 cursor-pointer" onClick={() => setSyncError(null)}>
        <AlertCircle size={14} /> {syncError} (Tap para reintentar)
      </div>
    )
  }

  if (totalPending === 0 && isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-xs text-gray-400">
        <Cloud size={14} className="text-green-400" /> Sincronizado
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-orange-500/20 backdrop-blur px-3 py-1.5 rounded-full border border-orange-500/30 flex items-center gap-2 text-xs text-orange-400">
        <CloudOff size={14} /> Offline ({totalPending} pendientes)
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-500/20 backdrop-blur px-3 py-1.5 rounded-full border border-blue-500/30 flex items-center gap-2 text-xs text-blue-400">
      <RefreshCw size={14} className="animate-spin" /> Sincronizando...
    </div>
  )
}
