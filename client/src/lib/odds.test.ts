import { describe, expect, it } from 'vitest'
import { fairProbs, formatMoneyline, impliedProbability } from './odds'

describe('impliedProbability', () => {
  it('converts a positive underdog moneyline', () => {
    expect(impliedProbability(600)).toBeCloseTo(100 / 700, 6)
  })

  it('converts a negative favorite moneyline', () => {
    expect(impliedProbability(-900)).toBeCloseTo(900 / 1000, 6)
  })

  it('converts -110 roughly to half', () => {
    expect(impliedProbability(-110)).toBeCloseTo(110 / 210, 6)
  })
})

describe('fairProbs', () => {
  it('normalizes a +600 underdog vs -900 favorite', () => {
    const { a, b } = fairProbs(600, -900)
    expect(a + b).toBeCloseTo(1, 10)
    expect(a).toBeLessThan(b)
    expect(a).toBeCloseTo(0.142857 / (0.142857 + 0.9), 3)
  })

  it('treats an even matchup symmetrically', () => {
    const { a, b } = fairProbs(-110, -110)
    expect(a).toBeCloseTo(0.5, 10)
    expect(b).toBeCloseTo(0.5, 10)
  })

  it('handles two negative moneylines', () => {
    const { a, b } = fairProbs(-150, -130)
    expect(a + b).toBeCloseTo(1, 10)
    expect(a).toBeGreaterThan(b)
  })
})

describe('formatMoneyline', () => {
  it('adds a plus sign for underdogs', () => {
    expect(formatMoneyline(150)).toBe('+150')
  })

  it('keeps the minus sign for favorites', () => {
    expect(formatMoneyline(-200)).toBe('-200')
  })
})
