import { useEffect } from 'react'

import { GameBoard } from '@/components/board/GameBoard'
import { useSettingsStore } from '@/stores/settings.store'

export const App = () => {
  const theme = useSettingsStore((s) => s.theme)

  // Apply theme to <body> so CSS variables cascade to all components
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)]">
      <GameBoard />
    </div>
  )
}
