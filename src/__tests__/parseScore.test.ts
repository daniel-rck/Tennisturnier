import { describe, expect, it } from 'vitest'
import { parsePositiveInt, parseScore } from '../utils/parseScore'

describe('parseScore', () => {
  it('returns undefined for empty string', () => {
    expect(parseScore('')).toBeUndefined()
  })

  it('returns floored int for valid numbers', () => {
    expect(parseScore('6')).toBe(6)
    expect(parseScore('6.7')).toBe(6)
    expect(parseScore('0')).toBe(0)
  })

  it('returns undefined for negative or NaN', () => {
    expect(parseScore('-1')).toBeUndefined()
    expect(parseScore('abc')).toBeUndefined()
  })
})

describe('parsePositiveInt', () => {
  it('returns fallback for empty or invalid input', () => {
    expect(parsePositiveInt('', 5)).toBe(5)
    expect(parsePositiveInt('abc', 7)).toBe(7)
  })

  it('rounds valid numbers', () => {
    expect(parsePositiveInt('3.4', 1)).toBe(3)
    expect(parsePositiveInt('3.6', 1)).toBe(4)
  })
})
