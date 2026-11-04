/**
 * Credit exposure as the console shows it, straight off GET /v1/credit/exposure. Money is naira,
 * already converted from the API's kobo, and nothing here is derived: the API owns the buckets, the
 * ageing and the weighted figure.
 */
export type ExposureBand = {
  key: string;
  label: string;
  fromDays: number;
  toDays: number;
  /** The age weighting this band carries, in percent: an assumption, not money owed. */
  weightPct: number;
};

type ExposureMoney = {
  owed: number;
  overdue: number;
  oldest: number;
  openInvoices: number;
  /** Money in each band, by band key; null when the API sent no figure for that band. */
  band: Record<string, number | null>;
  /** The age-weighted figure: shown as a label, never as money anyone owes. */
  weighted: number;
  /** Payments the bank confirmed. */
  verified: number;
  /** Shown to us but not counted yet. */
  shownNotCounted: number;
  confidence?: string;
  note?: string;
};

export type ExposureShop = ExposureMoney & { id: string; name: string };
export type ExposureTotal = ExposureMoney;
export type Exposure = { asOf: string; policyVersion?: string; bands: ExposureBand[]; shops: ExposureShop[]; total: ExposureTotal };
