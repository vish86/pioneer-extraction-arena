import type { DomainKey } from "./types";

export type DomainScenario = {
  key: DomainKey;
  emoji: string;
  label: string;
  short: string;
  schema: string[];
  sample: string;
  entityColors: Record<string, string>;
};

export const DOMAINS: DomainScenario[] = [
  {
    key: "medical",
    emoji: "🏥",
    label: "Clinical Notes",
    short: "medical NER",
    schema: [
      "patient_name",
      "condition",
      "medication",
      "dosage",
      "physician",
      "allergy",
      "date",
    ],
    sample: `Patient: Maria Chen, MRN 448291. Chief complaint: worsening shortness of breath over 10 days. History: Type 2 diabetes (metformin 500mg BID), hypertension on lisinopril 10mg daily. Allergy: penicillin (rash). Exam: BP 138/84, SpO2 93% on room air. Assessment: acute on chronic hypoxemia vs early pneumonia. Plan: start azithromycin 500mg day 1 then 250mg daily x4d, albuterol PRN, follow-up with Dr. Patel in Pulmonology within 72 hours. Next visit scheduled 06/12/2026.`,
    entityColors: {
      patient_name: "#00ff88",
      condition: "#ff3366",
      medication: "#00aaff",
      dosage: "#ffaa00",
      physician: "#cc88ff",
      allergy: "#ff3366",
      date: "#44ddcc",
    },
  },
  {
    key: "legal",
    emoji: "⚖️",
    label: "Legal Contract",
    short: "legal extraction",
    schema: [
      "party",
      "date",
      "obligation",
      "amount",
      "jurisdiction",
      "term",
      "agreement_type",
    ],
    sample: `This Software License Agreement ("Agreement") is entered into as of March 1, 2026 ("Effective Date") between Acme Analytics LLC, a Delaware limited liability company ("Licensor"), and Northwind Retail Inc., a California corporation ("Licensee"). Licensor grants Licensee a non-exclusive license to use the Product for $120,000 annually. Licensee shall maintain SOC 2 controls and pay invoices within thirty (30) days. This Agreement is governed by the laws of the State of New York. Either party may terminate for material breach upon thirty (30) days written notice. Disputes shall be resolved by binding arbitration in New York County under AAA rules.`,
    entityColors: {
      party: "#00ff88",
      date: "#44ddcc",
      obligation: "#ff3366",
      amount: "#ffaa00",
      jurisdiction: "#00aaff",
      term: "#cc88ff",
      agreement_type: "#00ff88",
    },
  },
  {
    key: "sales",
    emoji: "💼",
    label: "Sales CRM",
    short: "deal signal extraction",
    schema: [
      "person",
      "company",
      "amount",
      "date",
      "competitor",
      "technology",
      "deal_stage",
      "pain_point",
    ],
    sample: `Hi team — following up from yesterday's call with Jordan Lee (VP Ops) and Sam Ortiz (IT Director) at Helix Manufacturing. They're comparing us to VendorX and legacy spreadsheets. Estimated ACV $285k if we close by end of Q2. Their stack is Salesforce + Snowflake; main pain is manual quote-to-cash handoffs causing 2-week delays. Competitive intel: VendorX quoted $310k with weaker security review timeline. Next step: security questionnaire due 04/15/2026; stage moved to Evaluation.`,
    entityColors: {
      person: "#cc88ff",
      company: "#00ff88",
      amount: "#ffaa00",
      date: "#44ddcc",
      competitor: "#ff3366",
      technology: "#00aaff",
      deal_stage: "#cc88ff",
      pain_point: "#ff3366",
    },
  },
  {
    key: "news",
    emoji: "📰",
    label: "Market Intel",
    short: "financial news",
    schema: [
      "organization",
      "executive",
      "metric",
      "date",
      "product",
      "location",
      "competitor",
      "financial_figure",
    ],
    sample: `Aurora Systems (NASDAQ: AUR) reported Q1 revenue of $14.2B, up 18% YoY, beating analyst estimates. CEO Elena Park cited strength in cloud infrastructure and AI inference demand; CFO James Okonkwo noted operating margin improved to 24%. The company highlighted growth in APAC markets including Singapore and Tokyo. Competitor mention: rival TitanCloud lowered guidance last week. Aurora also announced a new data residency product line for regulated industries. Stock rose 4.2% after hours; forward guidance for FY2026 revenue $58–60B.`,
    entityColors: {
      organization: "#00ff88",
      executive: "#cc88ff",
      metric: "#00aaff",
      date: "#44ddcc",
      product: "#ffaa00",
      location: "#44ddcc",
      competitor: "#ff3366",
      financial_figure: "#ffaa00",
    },
  },
];

export function getDomain(key: DomainKey): DomainScenario {
  const d = DOMAINS.find((x) => x.key === key);
  if (!d) return DOMAINS[0];
  return d;
}
