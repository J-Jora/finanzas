"use client"

import React, { useMemo } from 'react'
import { useFinanceStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, TrendingUp, BrainCircuit } from 'lucide-react'

export default function Analytics() {
  const { transactions, categories, addCategory } = useFinanceStore()

  // 1. Detección Inteligente para categoría "Otros"
  const suggestions = useMemo(() => {
    const otrosCatIds = categories.filter(c => c.name.toLowerCase() === 'otros').map(c => c.id)
    const otrosTxs = transactions.filter(t => t.type === 'EXPENSE' && otrosCatIds.includes(t.category_id))
    
    const descCount: Record<string, number> = {}
    otrosTxs.forEach(tx => {
      if (tx.description) {
        const cleanDesc = tx.description.trim().toLowerCase()
        if (cleanDesc) {
          descCount[cleanDesc] = (descCount[cleanDesc] || 0) + 1
        }
      }
    })

    return Object.entries(descCount).filter(([desc, count]) => count >= 3).map(([desc]) => desc)
  }, [transactions, categories])


  // 2. Algoritmo de Riesgo a 3 meses
  const riskAnalysis = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'EXPENSE')
    if (expenses.length === 0) return { status: 'learning', msg: 'Esperando datos de gastos...' }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const currentMonthExpenses = expenses.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).reduce((acc, t) => acc + t.amount, 0)

    // Check if we have data from older months
    const hasOldData = expenses.some(t => {
      const d = new Date(t.date)
      return d.getMonth() !== currentMonth || d.getFullYear() !== currentYear
    })

    if (!hasOldData) {
      return { 
        status: 'learning', 
        msg: `Fase de aprendizaje (Mes 1). Gasto actual: Bs. ${currentMonthExpenses.toFixed(2)}` 
      }
    }

    // For MVP simplified mock average calculation (sum all past / distinct past months)
    const pastExpenses = expenses.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() !== currentMonth || d.getFullYear() !== currentYear
    })
    
    // Distinct months in past data
    const distinctMonths = new Set(pastExpenses.map(t => {
      const d = new Date(t.date)
      return `${d.getFullYear()}-${d.getMonth()}`
    })).size

    const totalPast = pastExpenses.reduce((acc, t) => acc + t.amount, 0)
    const averageMonthly = totalPast / (distinctMonths || 1)

    // Calculate pace
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const currentDay = now.getDate()
    const expectedSpendSoFar = (averageMonthly / daysInMonth) * currentDay

    if (currentMonthExpenses > expectedSpendSoFar * 1.2) {
      return {
        status: 'high',
        msg: `Riesgo Alto: Has gastado Bs. ${currentMonthExpenses.toFixed(0)} (usualmente a estas alturas gastas ~Bs. ${expectedSpendSoFar.toFixed(0)}). ¡Reduce el ritmo!`
      }
    } else if (currentMonthExpenses < expectedSpendSoFar * 0.8) {
      return {
        status: 'good',
        msg: `¡Excelente ritmo! Estás gastando menos que tu promedio histórico.`
      }
    }

    return {
      status: 'normal',
      msg: `Ritmo normal. Vas acorde a tu gasto promedio (Bs. ${averageMonthly.toFixed(0)}/mes).`
    }

  }, [transactions])

  const handleCreateSuggestedCategory = (desc: string) => {
    // In MVP, we just create it. The ideal logic would also update past txs category_id
    addCategory({
      user_id: 'local', // will be replaced or managed by auth in real flow
      name: desc.charAt(0).toUpperCase() + desc.slice(1),
      type: 'EXPENSE',
      is_system: false,
      icon: '✨'
    })
    alert(`Categoría "${desc}" creada exitosamente.`)
  }

  return (
    <div className="flex flex-col gap-6 mt-6">
      <Card className="bg-brand-card border-0 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-brand-bg/50">
          <CardTitle className="text-lg flex items-center gap-2 text-brand-text font-bold tracking-wide">
            <TrendingUp size={18} className="text-brand-accent" /> Estimación de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className={`p-4 rounded-xl border ${
            riskAnalysis.status === 'learning' ? 'bg-brand-bg border-brand-text-muted/20 text-brand-text-muted' :
            riskAnalysis.status === 'high' ? 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger' :
            riskAnalysis.status === 'good' ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' :
            'bg-brand-accent/10 border-brand-accent/20 text-brand-accent'
          }`}>
            <p className="text-sm font-semibold">{riskAnalysis.msg}</p>
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card className="bg-gradient-to-br from-[#1E2540] to-[#121626] border-0 shadow-md rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-300 font-bold tracking-wide">
              <BrainCircuit size={18} /> Asistente Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <p className="text-sm text-brand-text-muted mb-4 font-medium">
              He notado gastos recurrentes en la categoría "Otros". ¿Deseas convertirlos en categorías propias?
            </p>
            <div className="flex flex-col gap-3">
              {suggestions.map(s => (
                <div key={s} className="flex justify-between items-center bg-brand-bg/50 p-4 rounded-xl border border-indigo-500/10 shadow-sm">
                  <span className="font-bold capitalize text-indigo-100">"{s}"</span>
                  <button 
                    onClick={() => handleCreateSuggestedCategory(s)}
                    className="text-xs bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-lg text-white font-bold transition-all shadow-sm shadow-indigo-500/20 active:scale-95"
                  >
                    Crear Categoría
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
