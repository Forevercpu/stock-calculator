import Decimal from 'decimal.js'

export interface TradeInput {
  buyPrice: number
  buyQuantity: number
  sellPrice: number
  sellQuantity: number
}

export interface FeeSettings {
  commissionEnabled: boolean
  commissionRate: number
  minimumCommission: number
  stampDutyEnabled: boolean
  stampDutyRate: number
  transferFeeEnabled: boolean
  transferFeeRate: number
}

export interface CalculationResult {
  matchedQuantity: number
  unmatchedBuyQuantity: number
  unmatchedSellQuantity: number
  buyAmount: number
  sellAmount: number
  buyFees: number
  sellFees: number
  totalFees: number
  grossProfit: number
  netProfit: number
  priceChangeRate: number
  netReturnRate: number
  profitPerShare: number
  breakEvenSellPrice: number
}

export type PriceChangeDirection = 'increase' | 'decrease'

export interface PriceChangeResult {
  targetPrice: number
  priceDifference: number
}

const d = (value: number) => new Decimal(Number.isFinite(value) ? Math.max(value, 0) : 0)

export function calculatePriceChange(
  price: number,
  percentage: number,
  direction: PriceChangeDirection,
): PriceChangeResult {
  const basePrice = d(price)
  const rate = d(percentage).div(100)
  const priceDifference = basePrice.mul(rate)
  const signedDifference = direction === 'increase' ? priceDifference : priceDifference.negated()
  const targetPrice = Decimal.max(basePrice.add(signedDifference), 0)

  return {
    targetPrice: targetPrice.toNumber(),
    priceDifference: targetPrice.sub(basePrice).toNumber(),
  }
}

function commission(amount: Decimal, fees: FeeSettings) {
  if (!fees.commissionEnabled || amount.isZero()) return new Decimal(0)
  return Decimal.max(amount.mul(d(fees.commissionRate)).div(100), d(fees.minimumCommission))
}

function transferFee(amount: Decimal, fees: FeeSettings) {
  return fees.transferFeeEnabled ? amount.mul(d(fees.transferFeeRate)).div(100) : new Decimal(0)
}

function buySideFees(amount: Decimal, fees: FeeSettings) {
  return commission(amount, fees).add(transferFee(amount, fees))
}

function sellSideFees(amount: Decimal, fees: FeeSettings) {
  const stampDuty = fees.stampDutyEnabled
    ? amount.mul(d(fees.stampDutyRate)).div(100)
    : new Decimal(0)
  return commission(amount, fees).add(transferFee(amount, fees)).add(stampDuty)
}

function findBreakEvenPrice(
  buyAmount: Decimal,
  buyFees: Decimal,
  quantity: Decimal,
  fees: FeeSettings,
) {
  if (quantity.isZero()) return new Decimal(0)

  const target = buyAmount.add(buyFees)
  let low = new Decimal(0)
  let high = Decimal.max(buyAmount.div(quantity).mul(2), 1)

  while (high.mul(quantity).sub(sellSideFees(high.mul(quantity), fees)).lt(target)) {
    high = high.mul(2)
  }

  for (let index = 0; index < 80; index += 1) {
    const middle = low.add(high).div(2)
    const netProceeds = middle.mul(quantity).sub(sellSideFees(middle.mul(quantity), fees))
    if (netProceeds.gte(target)) high = middle
    else low = middle
  }

  return high
}

export function calculateTrade(trade: TradeInput, fees: FeeSettings): CalculationResult {
  const buyQuantity = d(Math.floor(trade.buyQuantity))
  const sellQuantity = d(Math.floor(trade.sellQuantity))
  const matchedQuantity = Decimal.min(buyQuantity, sellQuantity)
  const buyPrice = d(trade.buyPrice)
  const sellPrice = d(trade.sellPrice)
  const buyAmount = buyPrice.mul(matchedQuantity)
  const sellAmount = sellPrice.mul(matchedQuantity)
  const buyFees = buySideFees(buyAmount, fees)
  const sellFees = sellSideFees(sellAmount, fees)
  const totalFees = buyFees.add(sellFees)
  const grossProfit = sellAmount.sub(buyAmount)
  const netProfit = grossProfit.sub(totalFees)
  const buyCost = buyAmount.add(buyFees)

  return {
    matchedQuantity: matchedQuantity.toNumber(),
    unmatchedBuyQuantity: buyQuantity.sub(matchedQuantity).toNumber(),
    unmatchedSellQuantity: sellQuantity.sub(matchedQuantity).toNumber(),
    buyAmount: buyAmount.toNumber(),
    sellAmount: sellAmount.toNumber(),
    buyFees: buyFees.toNumber(),
    sellFees: sellFees.toNumber(),
    totalFees: totalFees.toNumber(),
    grossProfit: grossProfit.toNumber(),
    netProfit: netProfit.toNumber(),
    priceChangeRate: buyPrice.isZero() ? 0 : sellPrice.sub(buyPrice).div(buyPrice).mul(100).toNumber(),
    netReturnRate: buyCost.isZero() ? 0 : netProfit.div(buyCost).mul(100).toNumber(),
    profitPerShare: matchedQuantity.isZero() ? 0 : netProfit.div(matchedQuantity).toNumber(),
    breakEvenSellPrice: findBreakEvenPrice(buyAmount, buyFees, matchedQuantity, fees).toNumber(),
  }
}
