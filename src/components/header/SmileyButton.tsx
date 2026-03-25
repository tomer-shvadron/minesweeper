import { useSmileyButtonLogic } from './useSmileyButtonLogic'

import { Button } from '@/components/ui/Button'

export const SmileyButton = () => {
  const { emoji, label, onPress } = useSmileyButtonLogic()

  return (
    <Button variant="raised" aria-label={label} onClick={onPress} className="smiley-button">
      {emoji}
    </Button>
  )
}
