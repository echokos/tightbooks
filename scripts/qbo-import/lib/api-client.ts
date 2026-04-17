/**
 * Thin fetch wrapper for the Tightbooks / BigCapital API.
 * Handles auth (JWT + organization-id header) for all tenant-scoped requests.
 */

interface AuthTokens {
  accessToken: string;
  organizationId: string;
}

export class TightbooksApiClient {
  private tokens: AuthTokens | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly email: string,
    private readonly password: string,
  ) {}

  async authenticate(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Auth failed ${res.status}: ${body}`);
    }
    const data = (await res.json()) as { accessToken?: string; access_token?: string; organizationId?: string; organization_id?: string };
    this.tokens = {
      accessToken: (data.accessToken ?? data.access_token)!,
      organizationId: (data.organizationId ?? data.organization_id)!,
    };
  }

  private headers(): Record<string, string> {
    if (!this.tokens) throw new Error('Not authenticated — call authenticate() first');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.tokens.accessToken}`,
      'organization-id': this.tokens.organizationId,
    };
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GET ${path} failed ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async post<T>(
    path: string,
    body: unknown,
    maxRetries = 6,
  ): Promise<{ ok: boolean; status: number; data: T; raw: string }> {
    let attempt = 0;
    let delayMs = 2000;
    while (true) {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = Number(res.headers.get('retry-after') ?? 0);
        const wait = retryAfter > 0 ? retryAfter * 1000 : delayMs;
        await new Promise((r) => setTimeout(r, wait));
        delayMs = Math.min(delayMs * 2, 30_000);
        attempt++;
        continue;
      }
      const raw = await res.text();
      let data: T;
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw as unknown as T;
      }
      return { ok: res.ok, status: res.status, data, raw };
    }
  }
}
