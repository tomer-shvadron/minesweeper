import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LcdDisplay } from '@/components/ui/LcdDisplay'

describe('LcdDisplay', () => {
  it('renders a 3-digit zero-padded number', () => {
    render(<LcdDisplay value={5} />)
    expect(screen.getByText('005')).toBeInTheDocument()
  })

  it('renders 000 for value 0', () => {
    render(<LcdDisplay value={0} />)
    expect(screen.getByText('000')).toBeInTheDocument()
  })

  it('renders max value 999 without truncation', () => {
    render(<LcdDisplay value={999} />)
    expect(screen.getByText('999')).toBeInTheDocument()
  })

  it('clamps values above 999 to 999', () => {
    render(<LcdDisplay value={1234} />)
    expect(screen.getByText('999')).toBeInTheDocument()
  })

  it('renders a negative value with a leading dash', () => {
    render(<LcdDisplay value={-9} />)
    expect(screen.getByText('-09')).toBeInTheDocument()
  })

  it('renders -99 correctly', () => {
    render(<LcdDisplay value={-99} />)
    expect(screen.getByText('-99')).toBeInTheDocument()
  })

  it('clamps values below -99 to -99', () => {
    render(<LcdDisplay value={-150} />)
    expect(screen.getByText('-99')).toBeInTheDocument()
  })

  it('renders 42 as "042"', () => {
    render(<LcdDisplay value={42} />)
    expect(screen.getByText('042')).toBeInTheDocument()
  })

  it('sets the aria-label to the raw value', () => {
    render(<LcdDisplay value={7} />)
    expect(screen.getByLabelText('7')).toBeInTheDocument()
  })
})
