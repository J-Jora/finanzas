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

    addTransaction({
      user_id: userId,
      category_id: category?.id || 'unknown',
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
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Nueva Transacción</span>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`p-2 rounded-full transition-colors ${type === 'EXPENSE' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:bg-white/10'}`}
            >
              <MinusCircle size={24} />
            </button>
            <button 
              type="button"
              onClick={() => setType('INCOME')}
              className={`p-2 rounded-full transition-colors ${type === 'INCOME' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:bg-white/10'}`}
            >
              <PlusCircle size={24} />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Monto (Bs.)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Categoría</label>
            <input 
              type="text" 
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej. Comida, Transporte, Sueldo..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Descripción (Opcional)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalles de la transacción"
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 rounded-lg font-bold text-white transition-all hover:opacity-90 ${type === 'EXPENSE' ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-green-600 to-emerald-500'}`}
          >
            Guardar {type === 'EXPENSE' ? 'Gasto' : 'Ingreso'}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
