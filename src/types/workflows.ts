import type { Channel, PaginationParams } from './common.js';

// ── Step types ──────────────────────────────────────

export interface SendStep {
  type: 'send';
  channel: Channel;
  template: string;
}

export interface DelayStep {
  type: 'delay';
  /** Duração no formato "5m", "1h", "1d" */
  duration: string;
}

export interface FallbackStep {
  type: 'fallback';
  channels: Channel[];
  template: string;
}

export type WorkflowStep = SendStep | DelayStep | FallbackStep;

// ── Create / Update ─────────────────────────────────

export interface CreateWorkflowParams {
  /** Identificador URL-safe */
  slug: string;
  /** Nome legível */
  name: string;
  /** Passos do workflow (max 10) */
  steps: WorkflowStep[];
}

export interface UpdateWorkflowParams {
  name?: string;
  steps?: WorkflowStep[];
}

// ── Workflow object ─────────────────────────────────

export interface Workflow {
  id: string;
  slug: string;
  name: string;
  steps: WorkflowStep[];
  version: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Trigger ─────────────────────────────────────────

export interface TriggerWorkflowParams {
  /** Destinatário (email, telefone, subscriber_id) */
  recipient: string;
  /** Variáveis do template */
  data?: Record<string, unknown>;
}

// ── Workflow Runs ───────────────────────────────────

export type WorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  workflow_slug: string;
  workflow_version: number;
  status: WorkflowRunStatus;
  recipient: string;
  data?: Record<string, unknown>;
  step_results?: StepResult[];
  created_at: string;
  updated_at: string;
}

export interface StepResult {
  step_index: number;
  step_type: string;
  status: string;
  result?: Record<string, unknown>;
  executed_at: string;
}

// ── List params ─────────────────────────────────────

export interface ListWorkflowsParams extends PaginationParams {}

export interface ListWorkflowRunsParams extends PaginationParams {
  /** Filtrar por workflow_id */
  workflow_id?: string;
  /** Filtrar por status */
  status?: WorkflowRunStatus;
}
