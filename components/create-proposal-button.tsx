"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, FileText, FilePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CreateProposalButton() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white gap-2">
          Create proposal
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/proposals/new")}
          className="gap-2 cursor-pointer"
        >
          <FilePlus className="h-4 w-4" />
          Start from scratch
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/proposals/new?template=true")}
          className="gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          Choose a template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
