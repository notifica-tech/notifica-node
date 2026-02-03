import type { NotificaClient } from '../client.js';
import type { PaginatedResponse, RequestOptions, SingleResponse } from '../types/common.js';
import type {
  CreateWorkflowParams,
  ListWorkflowRunsParams,
  ListWorkflowsParams,
  TriggerWorkflowParams,
  UpdateWorkflowParams,
  Workflow,
  WorkflowRun,
} from '../types/workflows.js';

export class Workflows {
  constructor(private readonly client: NotificaClient) {}

  /**
   * Cria um novo workflow.
   *
   * @example
   * ```ts
   * const workflow = await notifica.workflows.create({
   *   slug: 'welcome-flow',
   *   name: 'Fluxo de Boas-Vindas',
   *   steps: [
   *     { type: 'send', channel: 'email', template: 'welcome-email' },
   *     { type: 'delay', duration: '1h' },
   *     { type: 'send', channel: 'whatsapp', template: 'welcome-whatsapp' },
   *   ],
   * });
   * ```
   */
  async create(params: CreateWorkflowParams, options?: RequestOptions): Promise<Workflow> {
    const response = await this.client.post<SingleResponse<Workflow>>(
      '/workflows',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista workflows com paginação.
   */
  async list(params?: ListWorkflowsParams, options?: RequestOptions): Promise<PaginatedResponse<Workflow>> {
    return this.client.list<Workflow>('/workflows', params as Record<string, unknown>, options);
  }

  /**
   * Itera automaticamente por todos os workflows.
   */
  listAll(params?: Omit<ListWorkflowsParams, 'cursor'>): AsyncIterableIterator<Workflow> {
    return this.client.paginate<Workflow>('/workflows', params as Record<string, unknown>);
  }

  /**
   * Obtém detalhes de um workflow.
   */
  async get(id: string, options?: RequestOptions): Promise<Workflow> {
    return this.client.getOne<Workflow>(`/workflows/${id}`, options);
  }

  /**
   * Atualiza um workflow (cria nova versão).
   */
  async update(id: string, params: UpdateWorkflowParams, options?: RequestOptions): Promise<Workflow> {
    const response = await this.client.put<SingleResponse<Workflow>>(
      `/workflows/${id}`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Deleta um workflow (soft delete).
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/workflows/${id}`, options);
  }

  /**
   * Dispara a execução de um workflow.
   *
   * @param slug — Slug do workflow
   * @param params — Recipient e dados
   *
   * @example
   * ```ts
   * const run = await notifica.workflows.trigger('welcome-flow', {
   *   recipient: '+5511999999999',
   *   data: { name: 'João', plan: 'pro' },
   * });
   * ```
   */
  async trigger(slug: string, params: TriggerWorkflowParams, options?: RequestOptions): Promise<WorkflowRun> {
    const response = await this.client.post<SingleResponse<WorkflowRun>>(
      `/workflows/${slug}/trigger`,
      params,
      options,
    );
    return response.data;
  }

  // ── Workflow Runs ───────────────────────────────────

  /**
   * Lista execuções de workflows.
   */
  async listRuns(params?: ListWorkflowRunsParams, options?: RequestOptions): Promise<PaginatedResponse<WorkflowRun>> {
    return this.client.list<WorkflowRun>('/workflow-runs', params as Record<string, unknown>, options);
  }

  /**
   * Obtém detalhes de uma execução (incluindo step_results).
   */
  async getRun(id: string, options?: RequestOptions): Promise<WorkflowRun> {
    return this.client.getOne<WorkflowRun>(`/workflow-runs/${id}`, options);
  }

  /**
   * Cancela uma execução em andamento.
   */
  async cancelRun(id: string, options?: RequestOptions): Promise<WorkflowRun> {
    const response = await this.client.post<SingleResponse<WorkflowRun>>(
      `/workflow-runs/${id}/cancel`,
      undefined,
      options,
    );
    return response.data;
  }
}
