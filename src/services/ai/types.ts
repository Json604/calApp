export type ProviderId = 'groq' | 'nvidia';

export type FailureKind =
  | 'transient'
  | 'timeout'
  | 'rate_limit'
  | 'server'
  | 'unsupported_model'
  | 'malformed'
  | 'not_configured'
  | 'invalid_user_input';

export class ProviderFailure extends Error {
  readonly kind: FailureKind;
  readonly provider: ProviderId;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(params: {
    kind: FailureKind;
    provider: ProviderId;
    message: string;
    status?: number;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = 'ProviderFailure';
    this.kind = params.kind;
    this.provider = params.provider;
    this.status = params.status;
    this.retryable = params.retryable ?? isRetryable(params.kind);
  }
}

function isRetryable(kind: FailureKind): boolean {
  return (
    kind === 'transient' ||
    kind === 'timeout' ||
    kind === 'rate_limit' ||
    kind === 'server' ||
    kind === 'malformed'
  );
}

export interface StructuredRequest {
  systemPrompt: string;
  userText: string;
  jsonHint?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface StructuredResult<T> {
  provider: ProviderId;
  data: T;
  rawText: string;
  latencyMs: number;
}

export interface AIProvider {
  id: ProviderId;
  isConfigured(): boolean;
  generateStructured(request: StructuredRequest): Promise<StructuredResult<unknown>>;
}

export interface GenerateStructuredOptions<T> {
  systemPrompt: string;
  userText: string;
  parse: (value: unknown) => T;
  jsonHint?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface GenerateStructuredSuccess<T> {
  ok: true;
  provider: ProviderId;
  data: T;
  latencyMs: number;
}

export interface GenerateStructuredError {
  ok: false;
  error: string;
  kind: FailureKind | 'all_failed';
  lastProvider?: ProviderId;
}

export type GenerateStructuredOutcome<T> =
  | GenerateStructuredSuccess<T>
  | GenerateStructuredError;
