"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useStore'
import Dashboard from '@/components/Dashboard'
import TransactionForm from '@/components/TransactionForm'
import Auth from '@/components/Auth'
import SyncManager from '@/components/SyncManager'
import Analytics from '@/components/Analytics'
import { Activity, LogOut } from 'lucide-react'

export default function Home() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { setProfile } = useFinanceStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setProfile({ id: session.user.id, email: session.user.email || '', created_at: new Date().toISOString() })
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        setProfile({ id: session.user.id, email: session.user.email || '', created_at: new Date().toISOString() })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
  }

  if (!session) {
    return <Auth />
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-8 pb-24 max-w-lg mx-auto w-full">
      <SyncManager session={session} />
      
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/20 p-2 rounded-xl">
            <Activity className="text-blue-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Finanzas</h1>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center border border-white/5 shadow-sm"
          title="Cerrar sesión"
        >
          <LogOut size={16} className="text-gray-300" />
        </button>
      </header>

      <div className="space-y-8">
        <Dashboard />
        <Analytics />
        <TransactionForm />
      </div>
    </main>
  )
}
