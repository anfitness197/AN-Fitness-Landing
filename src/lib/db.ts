export interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta?: any;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run<T = any>(): Promise<D1Result<T>>;
  all<T = any>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec<T = any>(query: string): Promise<D1Result<T>>;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  writeHttpMetadata(headers: Headers): void;
}

export interface R2Bucket {
  get(key: string): Promise<any | null>;
  put(key: string, value: any, options?: any): Promise<R2Object>;
  delete(key: string): Promise<void>;
}

class HttpD1PreparedStatement implements D1PreparedStatement {
  constructor(
    private sql: string,
    private params: any[] = [],
    private config: { accountId: string; databaseId: string; apiToken: string }
  ) {}

  bind(...values: any[]): D1PreparedStatement {
    return new HttpD1PreparedStatement(this.sql, values, this.config);
  }

  private async runQuery(): Promise<D1Result> {
    const { accountId, databaseId, apiToken } = this.config;
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql: this.sql,
        params: this.params,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`D1 HTTP API call failed: ${errText}`);
    }

    const data: any = await res.json();
    if (!data.success) {
      const err = data.errors?.[0] || { message: "Unknown D1 HTTP error" };
      throw new Error(`D1 HTTP Query failed: ${err.message}`);
    }

    const resultObj = data.result?.[0] || { success: false, results: [] };
    return {
      results: resultObj.results || [],
      success: resultObj.success || false,
      meta: resultObj.meta,
    };
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    const res = await this.runQuery();
    const row = res.results?.[0];
    if (!row) return null;
    if (colName) return (row as any)[colName] as T;
    return row as T;
  }

  async run<T = any>(): Promise<D1Result<T>> {
    return this.runQuery() as Promise<D1Result<T>>;
  }

  async all<T = any>(): Promise<D1Result<T>> {
    return this.runQuery() as Promise<D1Result<T>>;
  }
}

class HttpD1Database implements D1Database {
  private config: { accountId: string; databaseId: string; apiToken: string };

  constructor() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
    const databaseId = process.env.CLOUDFLARE_DATABASE_ID || "";
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";

    if (!accountId || !databaseId || !apiToken) {
      throw new Error(
        "Missing Cloudflare API credentials for D1 HTTP connection. " +
        "Please configure CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_API_TOKEN."
      );
    }

    this.config = { accountId, databaseId, apiToken };
  }

  prepare(query: string): D1PreparedStatement {
    return new HttpD1PreparedStatement(query, [], this.config);
  }

  async dump(): Promise<ArrayBuffer> {
    throw new Error("Dump is not supported over HTTP D1 client.");
  }

  async batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    throw new Error("Batch is not supported over HTTP D1 client.");
  }

  async exec<T = any>(query: string): Promise<D1Result<T>> {
    const stmt = this.prepare(query);
    return stmt.run<T>();
  }
}

export function getDB(): D1Database {
  const db = (process.env.DB || (globalThis as any).DB) as D1Database | undefined;
  if (!db) {
    return new HttpD1Database();
  }
  return db;
}

export function getR2(): R2Bucket {
  const r2 = (process.env.IMAGE_BUCKET || (globalThis as any).IMAGE_BUCKET) as R2Bucket | undefined;
  if (!r2) {
    throw new Error("R2 Bucket binding 'IMAGE_BUCKET' is missing. Please configure bindings.");
  }
  return r2;
}
