import { useSmileyButtonLogic } from './useSmileyButtonLogic'

import { Button } from '@/components/ui/Button'

export const SmileyButton = () => {
  const { emoji, label, onPress, animClass, clearAnimClass } = useSmileyButtonLogic()

  return (
    <Button
      variant="raised"
      aria-label={label}
      onClick={onPress}
      className={`flex h-11 w-11 items-center justify-center text-[1.875rem] p-0${animClass ? ` ${animClass}` : ''}`}
      onAnimationEnd={clearAnimClass}
    >
      {emoji}
    </Button>
  )
}
