import { useSmileyButtonLogic } from './useSmileyButtonLogic'

import { Button } from '@/components/ui/Button'

export const SmileyButton = () => {
  const { emoji, label, onPress, animClass, clearAnimClass } = useSmileyButtonLogic()

  return (
    <Button
      variant="raised"
      aria-label={label}
      onClick={onPress}
      className={animClass ? `smiley-button ${animClass}` : 'smiley-button'}
      onAnimationEnd={clearAnimClass}
    >
      {emoji}
    </Button>
  )
}
