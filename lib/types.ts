// ============================================================
// Anchor Dynamic Pricing – Core Types
// ============================================================

export type PricingAdjustmentType = "multiplier" | "fixed_add" | "fixed_subtract"

/** A single tier within a pricing parameter (e.g. "1-10 transactions → $100") */
export interface PricingTier {
  id: string
  label: string          // e.g. "1-10 transactions"
  description?: string
  /** For the *base* parameter this is the absolute price.
   *  For additional parameters this is the adjustment value. */
  value: number
}

/** A pricing parameter (e.g. "Transaction Volume" or "Locations") */
export interface PricingParameter {
  id: string
  name: string
  description?: string
  /** "base" = the root price driver, "additional" = modifier on top */
  kind: "base" | "additional"
  /** Only for additional parameters */
  adjustmentType?: PricingAdjustmentType
  tiers: PricingTier[]
  /** Which tier is currently selected (tier id) */
  selectedTierId?: string
}

/** A saved pricing template (reusable across services) */
export interface PricingTemplate {
  id: string
  name: string
  description?: string
  parameters: PricingParameter[]
  createdAt: string
  updatedAt: string
}

/** A service offered by the provider */
export interface Service {
  id: string
  name: string
  description?: string
  billingOccurrence: "one-time" | "monthly" | "quarterly" | "annually"
  pricingType: "set" | "dynamic"
  /** Sub-type when pricingType === "set" */
  setPricingMode?: "fixed" | "hourly" | "per_unit" | "range"
  /** Used when pricingType === "set" */
  fixedPrice?: number
  /** Used for range pricing */
  priceRangeMin?: number
  priceRangeMax?: number
  /** Used when pricingType === "dynamic" */
  parameters: PricingParameter[]
  discount?: number            // percentage 0-100
  discountType?: "percent" | "amount"
  billingTrigger: string
  createdAt: string
  updatedAt: string
}

/** A service as it appears inside a proposal (may have overridden pricing) */
export interface ProposalService {
  serviceId: string
  /** Snapshot of the service name at time of adding */
  name: string
  description?: string
  billingOccurrence: string
  pricingType: "set" | "dynamic"
  setPricingMode?: "fixed" | "hourly" | "per_unit" | "range"
  fixedPrice?: number
  priceRangeMin?: number
  priceRangeMax?: number
  parameters: PricingParameter[]
  discount?: number
  discountType?: "percent" | "amount"
  /** Whether provider has overridden pricing for this proposal */
  overridden: boolean
}

export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "declined"

export interface Proposal {
  id: string
  acceptanceToken?: string
  name: string
  clientName: string
  clientEmail: string
  effectiveDate: string
  introductoryMessage?: string
  /** Payment settings */
  paymentDueDays?: number
  processingFeePayer?: "provider" | "client" | "split"
  allowApproveWithoutPayment?: boolean
  allowManualApproval?: boolean
  /** Agreement term */
  agreementTerm?: "ongoing" | "fixed"
  termEndDate?: string
  services: ProposalService[]
  status: ProposalStatus
  signedAt?: string
  signedBy?: string
  createdAt: string
  updatedAt: string
}

/** Contact / client */
export interface Client {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
}
