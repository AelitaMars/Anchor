"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type {
  Service,
  Proposal,
  PricingTemplate,
  Client,
  ProposalService,
} from "./types"
import { generateId } from "./pricing"

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AppContextType {
  services: Service[]
  addService: (s: Service) => Promise<void>
  updateService: (s: Service) => Promise<void>
  deleteService: (id: string) => Promise<void>

  proposals: Proposal[]
  addProposal: (p: Proposal) => Promise<Proposal>
  updateProposal: (p: Proposal) => Promise<void>
  deleteProposal: (id: string) => Promise<void>

  pricingTemplates: PricingTemplate[]
  addPricingTemplate: (t: PricingTemplate) => Promise<void>
  updatePricingTemplate: (t: PricingTemplate) => Promise<void>
  deletePricingTemplate: (id: string) => Promise<void>

  clients: Client[]
  addClient: (c: Client) => Promise<void>
  deleteClient: (id: string) => Promise<void>

  generateId: () => string
  serviceToProposalService: (svc: Service) => ProposalService

  // Send a proposal — returns the acceptance URL and email status
  sendProposal: (id: string) => Promise<{ acceptanceUrl: string; emailSent: boolean; emailError: string | null }>

  loading: boolean
  refetch: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [svcs, props, tmpls, clts] = await Promise.all([
        apiFetch<Service[]>("/api/services"),
        apiFetch<Proposal[]>("/api/proposals"),
        apiFetch<PricingTemplate[]>("/api/templates"),
        apiFetch<Client[]>("/api/clients"),
      ])
      setServices(svcs)
      setProposals(props)
      setPricingTemplates(tmpls)
      setClients(clts)
    } catch (e) {
      console.error("Failed to load data:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Services
  const addService = useCallback(async (s: Service) => {
    const created = await apiFetch<Service>("/api/services", {
      method: "POST",
      body: JSON.stringify(s),
    })
    setServices((prev) => [...prev, created])
  }, [])

  const updateService = useCallback(async (s: Service) => {
    const updated = await apiFetch<Service>(`/api/services/${s.id}`, {
      method: "PUT",
      body: JSON.stringify(s),
    })
    setServices((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deleteService = useCallback(async (id: string) => {
    await apiFetch(`/api/services/${id}`, { method: "DELETE" })
    setServices((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Proposals
  const addProposal = useCallback(async (p: Proposal): Promise<Proposal> => {
    const created = await apiFetch<Proposal>("/api/proposals", {
      method: "POST",
      body: JSON.stringify(p),
    })
    setProposals((prev) => [created, ...prev])
    return created
  }, [])

  const updateProposal = useCallback(async (p: Proposal) => {
    const updated = await apiFetch<Proposal>(`/api/proposals/${p.id}`, {
      method: "PUT",
      body: JSON.stringify(p),
    })
    setProposals((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deleteProposal = useCallback(async (id: string) => {
    await apiFetch(`/api/proposals/${id}`, { method: "DELETE" })
    setProposals((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const sendProposal = useCallback(async (id: string) => {
    const result = await apiFetch<{ acceptanceUrl: string; emailSent: boolean; emailError: string | null; status: string }>(
      `/api/proposals/${id}/send`,
      { method: "POST" }
    )
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "sent" as const } : p))
    )
    return result
  }, [])

  // Templates
  const addPricingTemplate = useCallback(async (t: PricingTemplate) => {
    const created = await apiFetch<PricingTemplate>("/api/templates", {
      method: "POST",
      body: JSON.stringify(t),
    })
    setPricingTemplates((prev) => [...prev, created])
  }, [])

  const updatePricingTemplate = useCallback(async (t: PricingTemplate) => {
    const updated = await apiFetch<PricingTemplate>(`/api/templates/${t.id}`, {
      method: "PUT",
      body: JSON.stringify(t),
    })
    setPricingTemplates((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }, [])

  const deletePricingTemplate = useCallback(async (id: string) => {
    await apiFetch(`/api/templates/${id}`, { method: "DELETE" })
    setPricingTemplates((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Clients
  const addClient = useCallback(async (c: Client) => {
    const created = await apiFetch<Client>("/api/clients", {
      method: "POST",
      body: JSON.stringify(c),
    })
    setClients((prev) => [...prev, created])
  }, [])

  const deleteClient = useCallback(async (id: string) => {
    await apiFetch(`/api/clients/${id}`, { method: "DELETE" })
    setClients((prev) => prev.filter((x) => x.id !== id))
  }, [])

  // Helper: convert a service to a proposal-service snapshot
  const serviceToProposalService = useCallback((svc: Service): ProposalService => {
    return {
      serviceId: svc.id,
      name: svc.name,
      description: svc.description,
      billingOccurrence: svc.billingOccurrence,
      pricingType: svc.pricingType,
      setPricingMode: svc.setPricingMode,
      fixedPrice: svc.fixedPrice,
      priceRangeMin: svc.priceRangeMin,
      priceRangeMax: svc.priceRangeMax,
      parameters: JSON.parse(JSON.stringify(svc.parameters ?? [])),
      discount: svc.discount,
      discountType: svc.discountType,
      overridden: false,
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        services,
        addService,
        updateService,
        deleteService,
        proposals,
        addProposal,
        updateProposal,
        deleteProposal,
        sendProposal,
        pricingTemplates,
        addPricingTemplate,
        updatePricingTemplate,
        deletePricingTemplate,
        clients,
        addClient,
        deleteClient,
        generateId,
        serviceToProposalService,
        loading,
        refetch: fetchAll,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppContext must be used within AppProvider")
  return ctx
}
