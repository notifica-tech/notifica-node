import type { PaginationParams } from './common.js';

// ── Create ──────────────────────────────────────────

export interface CreateDomainParams {
  domain: string;
}

// ── Domain object ───────────────────────────────────

export type DomainStatus = 'pending' | 'verified' | 'failed';

export interface DnsRecord {
  name: string;
  type: string;
  value: string;
}

export interface Domain {
  id: string;
  domain: string;
  status: DomainStatus;
  dns_records?: {
    txt?: DnsRecord;
    dkim?: DnsRecord[];
    spf?: DnsRecord;
  };
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Health ──────────────────────────────────────────

export interface DomainHealth {
  domain_id: string;
  dns_valid: boolean;
  dkim_valid: boolean;
  spf_valid: boolean;
  last_checked_at: string;
  issues?: string[];
}

export interface DomainAlert {
  id: string;
  domain_id: string;
  alert_type: string;
  message: string;
  severity: string;
  created_at: string;
}

// ── List params ─────────────────────────────────────

export interface ListDomainsParams extends PaginationParams {}
