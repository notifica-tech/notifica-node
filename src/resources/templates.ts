import type { NotificaClient } from '../client.ts';
import type { PaginatedResponse, RequestOptions, SingleResponse } from '../types/common.ts';
import type {
  CreateTemplateParams,
  ListTemplatesParams,
  PreviewContentParams,
  PreviewResult,
  PreviewTemplateParams,
  Template,
  UpdateTemplateParams,
  ValidateContentParams,
  ValidationResult,
} from '../types/templates.ts';

export class Templates {
  private readonly client: NotificaClient;

  constructor(client: NotificaClient) {
    this.client = client;
  }

  /**
   * Cria um novo template.
   *
   * @example
   * ```ts
   * const template = await notifica.templates.create({
   *   channel: 'email',
   *   slug: 'welcome-email',
   *   name: 'Email de Boas-Vindas',
   *   content: 'Olá {{name}}, bem-vindo!',
   * });
   * ```
   */
  async create(params: CreateTemplateParams, options?: RequestOptions): Promise<Template> {
    const response = await this.client.post<SingleResponse<Template>>(
      '/templates',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Lista templates com paginação.
   */
  async list(params?: ListTemplatesParams, options?: RequestOptions): Promise<PaginatedResponse<Template>> {
    return this.client.list<Template>('/templates', params as Record<string, unknown>, options);
  }

  /**
   * Itera automaticamente por todos os templates.
   */
  listAll(params?: Omit<ListTemplatesParams, 'cursor'>): AsyncIterableIterator<Template> {
    return this.client.paginate<Template>('/templates', params as Record<string, unknown>);
  }

  /**
   * Obtém detalhes de um template.
   */
  async get(id: string, options?: RequestOptions): Promise<Template> {
    return this.client.getOne<Template>(`/templates/${id}`, options);
  }

  /**
   * Atualiza um template.
   */
  async update(id: string, params: UpdateTemplateParams, options?: RequestOptions): Promise<Template> {
    const response = await this.client.put<SingleResponse<Template>>(
      `/templates/${id}`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Deleta um template.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this.client.delete(`/templates/${id}`, options);
  }

  /**
   * Preview de um template salvo com variáveis.
   *
   * @example
   * ```ts
   * const preview = await notifica.templates.preview('tpl_abc', {
   *   variables: { name: 'João' },
   * });
   * ```
   */
  async preview(id: string, params: PreviewTemplateParams, options?: RequestOptions): Promise<PreviewResult> {
    const response = await this.client.post<SingleResponse<PreviewResult>>(
      `/templates/${id}/preview`,
      params,
      options,
    );
    return response.data;
  }

  /**
   * Preview de conteúdo arbitrário (útil para editor em tempo real).
   */
  async previewContent(params: PreviewContentParams, options?: RequestOptions): Promise<PreviewResult> {
    const response = await this.client.post<SingleResponse<PreviewResult>>(
      '/templates/preview',
      params,
      options,
    );
    return response.data;
  }

  /**
   * Valida um template salvo.
   */
  async validate(id: string, options?: RequestOptions): Promise<ValidationResult> {
    const response = await this.client.post<SingleResponse<ValidationResult>>(
      `/templates/${id}/validate`,
      undefined,
      options,
    );
    return response.data;
  }

  /**
   * Valida conteúdo arbitrário.
   */
  async validateContent(params: ValidateContentParams, options?: RequestOptions): Promise<ValidationResult> {
    const response = await this.client.post<SingleResponse<ValidationResult>>(
      '/templates/validate',
      params,
      options,
    );
    return response.data;
  }
}
