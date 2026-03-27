import { describe, expect, it } from 'vitest'

import { DEFAULT_KEY_BINDINGS, KEYBOARD_ACTION_LABELS } from '@/constants/keyboard.constants'
import type { KeyboardAction } from '@/types/settings.types'

const ALL_ACTIONS: KeyboardAction[] = [
  'moveUp',
  'moveDown',
  'moveLeft',
  'moveRight',
  'reveal',
  'flag',
  'chord',
  'newGame',
]

describe('DEFAULT_KEY_BINDINGS', () => {
  it('has a binding for every KeyboardAction', () => {
    for (const action of ALL_ACTIONS) {
      expect(DEFAULT_KEY_BINDINGS[action]).toBeDefined()
      expect(typeof DEFAULT_KEY_BINDINGS[action]).toBe('string')
    }
  })

  it('uses arrow keys for movement', () => {
    expect(DEFAULT_KEY_BINDINGS.moveUp).toBe('ArrowUp')
    expect(DEFAULT_KEY_BINDINGS.moveDown).toBe('ArrowDown')
    expect(DEFAULT_KEY_BINDINGS.moveLeft).toBe('ArrowLeft')
    expect(DEFAULT_KEY_BINDINGS.moveRight).toBe('ArrowRight')
  })
})

describe('KEYBOARD_ACTION_LABELS', () => {
  it('has a label for every KeyboardAction', () => {
    for (const action of ALL_ACTIONS) {
      expect(KEYBOARD_ACTION_LABELS[action]).toBeDefined()
      expect(typeof KEYBOARD_ACTION_LABELS[action]).toBe('string')
    }
  })
})
