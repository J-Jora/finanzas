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
    <div className="flex flex-col gap-4 mt-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Estimación de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${
            riskAnalysis.status === 'learning' ? 'bg-gray-500/10 border-gray-500/20 text-gray-300' :
            riskAnalysis.status === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            riskAnalysis.status === 'good' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
            'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}>
            <p className="text-sm font-medium">{riskAnalysis.msg}</p>
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card className="bg-indigo-900/20 border-indigo-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-300">
              <BrainCircuit size={18} /> Asistente Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-3">
              He notado gastos recurrentes en la categoría "Otros". ¿Deseas convertirlos en categorías propias?
            </p>
            <div className="flex flex-col gap-2">
              {suggestions.map(s => (
                <div key={s} className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5">
                  <span className="font-semibold capitalize text-indigo-200">"{s}"</span>
                  <button 
                    onClick={() => handleCreateSuggestedCategory(s)}
                    className="text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-md text-white font-bold transition"
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
