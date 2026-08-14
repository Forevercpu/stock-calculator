import { describe, expect, it } from 'vitest'
import { calculateTrade, type FeeSettings } from './calculator'

const fees: FeeSettings = {
  commissionEnabled: true,
  commissionRate: 0.025,
  minimumCommission: 5,
  stampDutyEnabled: true,
  stampDutyRate: 0.05,
  transferFeeEnabled: true,
  transferFeeRate: 0.001,
}

describe('calculateTrade', () => {
  it('calculates matched trade profit and all fees precisely', () => {
    const result = calculateTrade(
      { buyPrice: 10, buyQuantity: 1000, sellPrice: 10.2, sellQuantity: 1000 },
      fees,
    )

    expect(result.buyFees).toBeCloseTo(5.1, 8)
    expect(result.sellFees).toBeCloseTo(10.202, 8)
    expect(result.netProfit).toBeCloseTo(184.698, 8)
    expect(result.netReturnRate).toBeCloseTo(1.846_038_520_354_619_2, 8)
  })

  it('uses the lower quantity and reports unmatched shares', () => {
    const result = calculateTrade(
      { buyPrice: 10, buyQuantity: 1200, sellPrice: 10.2, sellQuantity: 1000 },
      fees,
    )

    expect(result.matchedQuantity).toBe(1000)
    expect(result.unmatchedBuyQuantity).toBe(200)
    expect(result.unmatchedSellQuantity).toBe(0)
  })

  it('returns safe zero values for an incomplete trade', () => {
    const result = calculateTrade(
      { buyPrice: 10, buyQuantity: 0, sellPrice: 10.2, sellQuantity: 0 },
      fees,
    )

    expect(result.netProfit).toBe(0)
    expect(result.netReturnRate).toBe(0)
    expect(result.breakEvenSellPrice).toBe(0)
  })

  it('finds a sell price that covers both sides of fees', () => {
    const result = calculateTrade(
      { buyPrice: 10, buyQuantity: 1000, sellPrice: 10.2, sellQuantity: 1000 },
      fees,
    )
    const breakEvenResult = calculateTrade(
      {
        buyPrice: 10,
        buyQuantity: 1000,
        sellPrice: result.breakEvenSellPrice,
        sellQuantity: 1000,
      },
      fees,
    )

    expect(breakEvenResult.netProfit).toBeCloseTo(0, 8)
  })
})
