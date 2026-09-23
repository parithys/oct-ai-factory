import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACRONYMS: Record<string, string> = {
  idt: 'IDT',
  ide: 'IDE',
  idso: 'IDSO',
  ciso: 'CISO',
  sla: 'SLA',
  ai: 'AI',
  ml: 'ML',
  llm: 'LLM',
  rag: 'RAG',
  api: 'API',
  gm: 'GM',
  sme: 'SME',
  poc: 'POC',
  kpi: 'KPI',
};

/** Formats a camelCase identifier into a human-readable label with proper acronym capitalization. */
export function formatLabel(camelCase: string): string {
  const words = camelCase.replace(/([A-Z])/g, ' $1').trim().split(' ');
  return words.map(w => {
    const lower = w.toLowerCase();
    return ACRONYMS[lower] || (w.charAt(0).toUpperCase() + w.slice(1));
  }).join(' ');
}
