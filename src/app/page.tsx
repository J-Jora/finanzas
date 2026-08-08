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
      
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-brand-accent/10 p-2.5 rounded-xl border border-brand-accent/20 shadow-inner">
            <Activity className="text-brand-accent" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">FinTrack</h1>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-11 h-11 rounded-full bg-brand-card hover:bg-brand-card-hover transition-all flex items-center justify-center border border-transparent hover:border-brand-text-muted/20 shadow-sm active:scale-95"
          title="Cerrar sesión"
        >
          <LogOut size={18} className="text-brand-text-muted hover:text-brand-text transition-colors" />
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
