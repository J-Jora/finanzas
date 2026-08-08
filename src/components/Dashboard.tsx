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
      <Card className="bg-gradient-to-br from-indigo-600/90 to-purple-800/90 border-0 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-white/80 text-sm font-normal flex items-center gap-2">
            <Wallet size={16} /> Balance Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-white tracking-tight">Bs. {balance.toFixed(2)}</p>
        </CardContent>
      </Card>

      {/* Income / Expense split */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <ArrowUpCircle size={14} className="text-green-400" /> Ingresos
            </span>
            <span className="text-xl font-semibold text-green-400">Bs. {totalIncome.toFixed(2)}</span>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <ArrowDownCircle size={14} className="text-red-400" /> Gastos
            </span>
            <span className="text-xl font-semibold text-red-400">Bs. {totalExpense.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-3">Movimientos Recientes</h3>
        {activeTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6 bg-white/5 rounded-xl border border-white/5">
            Aún no hay transacciones.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeTransactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition group">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-200">
                    {tx.description || 'Sin descripción'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(tx.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} Bs. {tx.amount.toFixed(2)}
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
