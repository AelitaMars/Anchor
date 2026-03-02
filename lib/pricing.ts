import type { PricingParameter } from "./types"

/**
 * Calculate the total price for a set of pricing parameters.
 *
 * 1. Find the "base" parameter and use its selected tier value as the starting price.
 * 2. Walk through each "additional" parameter:
 *    - "multiplier"       → basePrice * value  (e.g. 1.2x)
 *    - "fixed_add"        → basePrice + value
 *    - "fixed_subtract"   → basePrice - value
 * 3. Return the final computed price (min 0).
 */
export function calculateDynamicPrice(parameters: PricingParameter[]): number {
  const baseParam = parameters.find((p) => p.kind === "base")
  if (!baseParam) return 0

  const baseTier = baseParam.tiers.find((t) => t.id === baseParam.selectedTierId)
  let price = baseTier?.value ?? 0

  for (const param of parameters) {
    if (param.kind === "base") continue
    const tier = param.tiers.find((t) => t.id === param.selectedTierId)
    if (!tier) continue

    switch (param.adjustmentType) {
      case "multiplier":
        price = price * tier.value
        break
      case "fixed_add":
        price = price + tier.value
        break
      case "fixed_subtract":
        price = price - tier.value
        break
    }
  }

  return Math.max(0, Math.round(price * 100) / 100)
}

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Generate a simple unique id.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
