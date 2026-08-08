"use client"

import React, { useEffect, useState } from 'react'
import { useFinanceStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'

export default function Dashboard() {
  const { transactions } = useFinanceStore()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by rendering only after mount for local storage
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="animate-pulse h-64 bg-white/5 rounded-xl mt-6 max-w-md mx-auto"></div>

  const activeTransactions = transactions.filter(t => !t.is_deleted)

  const totalIncome = activeTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = activeTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  return (
    <div className="w-full max-w-md mx-auto mt-6 flex flex-col gap-4">
      
      {/* Main Balance Card */}
      <Card className="bg-brand-card border-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <CardHeader className="pb-1">
          <CardTitle className="text-brand-text-muted text-sm font-medium flex items-center gap-2 uppercase tracking-wider">
            <Wallet size={16} /> Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-brand-text tracking-tight mt-1">
            <span className="text-brand-text-muted text-2xl font-normal">$</span> {balance.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Income / Expense split */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-brand-card border-0 shadow-md hover:bg-brand-card-hover transition-colors">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-brand-text-muted flex items-center gap-1 uppercase tracking-wide font-semibold">
              <ArrowUpCircle size={14} className="text-brand-success" /> Income
            </span>
            <span className="text-xl font-bold text-brand-success">${totalIncome.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card className="bg-brand-card border-0 shadow-md hover:bg-brand-card-hover transition-colors">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs text-brand-text-muted flex items-center gap-1 uppercase tracking-wide font-semibold">
              <ArrowDownCircle size={14} className="text-brand-danger" /> Spent
            </span>
            <span className="text-xl font-bold text-brand-danger">${totalExpense.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <div className="mt-6">
        <h3 className="text-lg font-bold text-brand-text mb-4">Recent Activity</h3>
        {activeTransactions.length === 0 ? (
          <p className="text-brand-text-muted text-sm text-center py-8 bg-brand-card rounded-2xl border-0 shadow-sm">
            No transactions yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeTransactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-4 bg-brand-card rounded-2xl shadow-sm hover:bg-brand-card-hover transition-colors group">
                <div className="flex flex-col">
                  <span className="font-semibold text-brand-text text-base">
                    {tx.description || 'Sin descripción'}
                  </span>
                  <span className="text-xs text-brand-text-muted font-medium mt-0.5">
                    {new Date(tx.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${tx.type === 'INCOME' ? 'text-brand-success' : 'text-brand-text'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                  <button 
                    onClick={() => {
                      if(window.confirm('¿Eliminar este registro?')) {
                        useFinanceStore.getState().deleteTransaction(tx.id)
                      }
                    }}
                    className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500/10 rounded-md"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
