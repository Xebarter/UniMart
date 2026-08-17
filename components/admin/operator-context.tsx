'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AdminOperator } from '@/lib/types'

const OperatorContext = createContext<AdminOperator | null>(null)

export function OperatorProvider({ operator, children }: { operator: AdminOperator; children: ReactNode }) {
  return <OperatorContext.Provider value={operator}>{children}</OperatorContext.Provider>
}

export function useOperator() {
  const value = useContext(OperatorContext)
  if (!value) throw new Error('useOperator must be used within AdminShell')
  return value
}
