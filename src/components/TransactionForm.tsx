"use client"

import React, { useState } from 'react'
import { useFinanceStore } from '@/store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { PlusCircle, MinusCircle } from 'lucide-react'

export default function TransactionForm() {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryName, setCategoryName] = useState('')

  const { addTransaction, categories, addCategory, profile } = useFinanceStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) return
    
    const userId = profile?.id || 'unknown'

    // Auto-create category if doesn't exist
    let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
    
    if (!category && categoryName.trim() !== '') {
      const newCatId = crypto.randomUUID()
      addCategory({
        user_id: userId,
        name: categoryName,
        type: type,
        is_system: false,
        icon: '🏷️'
      })
      
      category = { id: newCatId, name: categoryName, type, user_id: userId, is_system: false, created_at: new Date().toISOString() }
    }

    let finalCategoryId = category?.id
    if (!finalCategoryId) {
      alert("Por favor ingresa una categoría válida")
      return
    }

    addTransaction({
      user_id: userId,
      category_id: finalCategoryId,
      amount: Number(amount),
      date: new Date().toISOString(),
      description,
      type
    })

    setAmount('')
    setDescription('')
    setCategoryName('')
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-6 bg-brand-card border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-brand-bg/50 pb-4">
        <CardTitle className="text-xl flex justify-between items-center text-brand-text">
          <span className="font-bold tracking-wide">Nueva Transacción</span>
          <div className="flex gap-1 bg-brand-bg rounded-full p-1 border border-brand-card-hover">
            <button 
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`p-2 rounded-full transition-all ${type === 'EXPENSE' ? 'bg-brand-danger text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
            >
              <MinusCircle size={20} />
            </button>
            <button 
              type="button"
              onClick={() => setType('INCOME')}
              className={`p-2 rounded-full transition-all ${type === 'INCOME' ? 'bg-brand-success text-white shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
            >
              <PlusCircle size={20} />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-brand-text-muted">Monto</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-brand-text-muted font-bold text-lg">Bs.</span>
              <input 
                type="number" 
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-brand-bg border border-transparent rounded-xl py-4 pl-12 pr-4 text-brand-text font-bold text-lg focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-brand-text-muted">Categoría</label>
            <input 
              type="text" 
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-brand-bg border border-transparent rounded-xl p-4 text-brand-text focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-brand-text-muted/50"
              placeholder="Ej. Comida, Transporte..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-brand-text-muted">Descripción</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-brand-bg border border-transparent rounded-xl p-4 text-brand-text focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all placeholder:text-brand-text-muted/50"
              placeholder="Opcional"
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-4 mt-2 rounded-xl font-bold text-brand-bg text-lg transition-transform hover:scale-[1.02] active:scale-95 shadow-md ${type === 'EXPENSE' ? 'bg-brand-danger shadow-brand-danger/20' : 'bg-brand-accent shadow-brand-accent/20'}`}
          >
            Guardar {type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
