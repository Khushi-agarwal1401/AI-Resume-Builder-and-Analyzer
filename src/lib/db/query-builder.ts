import type { Pool } from "@neondatabase/serverless";
import { getPool } from "./connection";
import {
  findJoinColumn,
  getTableColumns,
  isArrayUdt,
  isDateType,
  isJsonType,
  type TableColumn,
} from "./schema";

/**
 * PostgREST-style query builder backed directly by Postgres (Neon).
 *
 * The app's services/routes were built against the chainable query API
 * (`.from().select().eq().single()` …). Reimplementing that surface over
 * parameterized SQL lets every existing call site keep working without change
 * while dropping the external client library + RLS entirely.
 *
 * Supported: select (+ nested `table(columns)` joins), insert/update/upsert/
 * delete with RETURNING, filters (eq/neq/in/gte/gt/lte/lt/is/not/or/range),
 * ordering (incl. `referencedTable`), limit/range, single/maybeSingle, and
 * `count: "exact"` head/count queries.
 */

export type FilterOperator = "eq" | "neq" | "in" | "gt" | "gte" | "lt" | "lte" | "ilike" | "like" | "is" | "not" | "or";

interface Filter {
  col: string;
  op: FilterOperator;
  value: unknown;
}

interface OrderSpec {
  col: string;
  ascending: boolean;
  nullsFirst: boolean | undefined;
  referencedTable?: string;
}

interface SelectColumn {
  table: string;
  columns: string | null; // null = "*"
}

// ok()/err() build arbitrary-shaped results that get narrowed to the generic
// Row type at each call site via execute()/then() — `any` is the deliberate
// escape hatch here, so it is the one place the default is not `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface QueryResult<T = any> {
  data: T | null;
  error: { message: string; details: string; hint: string; code: string } | null;
  count: number | null;
  status: number;
  statusText: string;
}

const ok = (data: unknown, count: number | null = null): QueryResult => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: "OK",
});

const err = (message: string, code = "PGRST", details = ""): QueryResult => ({
  data: null,
  error: { message, details, hint: "", code },
  count: null,
  status: 400,
  statusText: "Bad Request",
});

/** Parse a `a, b, child(c, d), e` column string into main + related columns. */
function parseSelectColumns(input: string): { main: string[]; related: SelectColumn[] } {
  const main: string[] = [];
  const related: SelectColumn[] = [];
  const tokens: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      tokens.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) tokens.push(current.trim());

  for (const token of tokens) {
    const open = token.indexOf("(");
    if (open === -1) {
      main.push(token);
      continue;
    }
    const close = token.lastIndexOf(")");
    const table = token.slice(0, open).trim();
    const inner = token.slice(open + 1, close).trim();
    related.push({ table, columns: inner || "*" });
  }
  return { main, related };
}

function unquoteIdentifier(name: string): string {
  return name.replace(/^"(.*)"$/, "$1");
}

/** Flatten (Date → ISO) and normalize a single value based on column type. */
function normalizeValue(value: unknown, col?: TableColumn): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) {
    return isDateType(col?.udt || "") ? value.toISOString().slice(0, 10) : value.toISOString();
  }
  if (typeof value === "bigint") return Number(value);
  return value;
}

export class PostgresQueryBuilder<Row = never, Single extends boolean = false> {
  private pool: Pool;
  private table: string;
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private filters: Filter[] = [];
  private orders: OrderSpec[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private selectColumns: string[] | null = null;
  private insertRows: Array<Record<string, unknown>> = [];
  private updateData: Record<string, unknown> = {};
  private onConflict: string | null = null;
  private returning: string | null = null;
  private countOption: "exact" | "planned" | "estimated" | null = null;
  private headOnly = false;
  private singleMode: "single" | "maybeSingle" | null = null;

  constructor(table: string, pool?: Pool) {
    this.table = table;
    this.pool = pool ?? getPool();
  }

  // ── Query configuration ────────────────────────────────────────────────

  select(columns?: string, opts?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): this {
    const cols = columns?.trim();
    if (this.mode === "select") {
      // Plain read: record the columns to fetch.
      if (cols) {
        this.selectColumns = [cols];
      }
    } else {
      // Write + `.select()`: return the written rows. Keep the
      // write mode and record the columns to RETURNING instead.
      this.returning = cols && cols !== "*" ? cols : "*";
    }
    if (opts?.count) this.countOption = opts.count;
    if (opts?.head) this.headOnly = true;
    return this;
  }

  insert(rows: Record<string, unknown> | Array<Record<string, unknown>>): this {
    this.mode = "insert";
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(data: Record<string, unknown>): this {
    this.mode = "update";
    this.updateData = data;
    return this;
  }

  upsert(rows: Record<string, unknown> | Array<Record<string, unknown>>, opts?: { onConflict?: string }): this {
    this.mode = "upsert";
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    this.onConflict = opts?.onConflict ?? "id";
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(col: string, value: unknown): this {
    this.filters.push({ col, op: "eq", value });
    return this;
  }

  neq(col: string, value: unknown): this {
    this.filters.push({ col, op: "neq", value });
    return this;
  }

  in(col: string, values: unknown[]): this {
    this.filters.push({ col, op: "in", value: values });
    return this;
  }

  gt(col: string, value: unknown): this {
    this.filters.push({ col, op: "gt", value });
    return this;
  }

  gte(col: string, value: unknown): this {
    this.filters.push({ col, op: "gte", value });
    return this;
  }

  lt(col: string, value: unknown): this {
    this.filters.push({ col, op: "lt", value });
    return this;
  }

  lte(col: string, value: unknown): this {
    this.filters.push({ col, op: "lte", value });
    return this;
  }

  ilike(col: string, pattern: string): this {
    this.filters.push({ col, op: "ilike", value: pattern });
    return this;
  }

  like(col: string, pattern: string): this {
    this.filters.push({ col, op: "like", value: pattern });
    return this;
  }

  is(col: string, value: unknown): this {
    this.filters.push({ col, op: "is", value });
    return this;
  }

  not(col: string, op: string, value: unknown): this {
    if (op === "is" && value === null) {
      this.filters.push({ col, op: "is", value: "__NOT_NULL__" });
      return this;
    }
    this.filters.push({ col, op: "not", value });
    return this;
  }

  /** Basic PostgREST `or(...)` support: `col1.eq.v1, col2.gte.v2` → (a OR b). */
  or(filterString: string): this {
    const groups = filterString.split(",").map((part) => part.trim()).filter(Boolean);
    const parsed = groups.map((part) => {
      const m = part.match(/^([\w.]+)\.([\w]+)\.(.+)$/);
      if (!m) return null;
      return { col: m[1], op: m[2] as FilterOperator, value: parseOrValue(m[3]) };
    });
    this.filters.push({ col: "__or__", op: "or", value: parsed.filter(Boolean) });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean; referencedTable?: string }): this {
    this.orders.push({
      col,
      ascending: opts?.ascending ?? true,
      nullsFirst: opts?.nullsFirst,
      referencedTable: opts?.referencedTable,
    });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): PostgresQueryBuilder<Row, true> {
    this.singleMode = "single";
    return this as unknown as PostgresQueryBuilder<Row, true>;
  }

  maybeSingle(): PostgresQueryBuilder<Row, true> {
    this.singleMode = "maybeSingle";
    return this as unknown as PostgresQueryBuilder<Row, true>;
  }

  maybe(): PostgresQueryBuilder<Row, true> {
    this.singleMode = "maybeSingle";
    return this as unknown as PostgresQueryBuilder<Row, true>;
  }

  returns(mode: "minimal" | "representation" | "count" | "head"): this {
    if (mode === "count") this.headOnly = true;
    return this;
  }

  // ── Execution ──────────────────────────────────────────────────────────

  then<TResult1 = QueryResult<Single extends true ? Row : Row[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<Single extends true ? Row : Row[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  async execute(): Promise<QueryResult<Single extends true ? Row : Row[]>> {
    try {
      switch (this.mode) {
        case "select":
          return await this.runSelect();
        case "insert":
          return await this.runInsert("insert");
        case "upsert":
          return await this.runInsert("upsert");
        case "update":
          return await this.runUpdate();
        case "delete":
          return await this.runDelete();
        default:
          return err("Unsupported operation");
      }
    } catch (e) {
      const pgError = e as { code?: string; message?: string; detail?: string };
      return err(
        pgError.message || "Database error",
        pgError.code || "PGRST",
        pgError.detail || ""
      );
    }
  }

  // ── SELECT ─────────────────────────────────────────────────────────────

  private async runSelect(): Promise<QueryResult> {
    const columnsMeta = await getTableColumns(this.table);
    const parsed = this.selectColumns ? parseSelectColumns(this.selectColumns[0]) : { main: ["*"], related: [] };
    const mainCols =
      parsed.main.length === 1 && parsed.main[0] === "*"
        ? [...columnsMeta.keys()]
        : parsed.main.map(unquoteIdentifier);

    // Related child tables (nested select).
    const relatedSpecs: Array<{ table: string; columns: string | null; pkCol: string }> = [];
    for (const rel of parsed.related) {
      const join = await findJoinColumn(rel.table, this.table);
      if (!join) {
        return err(`Cannot resolve relationship between "${rel.table}" and "${this.table}"`);
      }
      relatedSpecs.push({
        table: rel.table,
        columns: !rel.columns || rel.columns === "*" ? null : rel.columns.split(",").map((c) => c.trim()).filter(Boolean).join(","),
        pkCol: join.parentColumn,
      });
    }

    // Build WHERE from filters.
    const { whereSql, params } = await this.buildWhere(this.table, columnsMeta);

    // Count query (head-only or paired with data).
    if (this.countOption === "exact") {
      const countSql = `SELECT count(*)::int AS count FROM "${this.table}" ${whereSql}`;
      const countRes = await this.pool.query(countSql, params);
      const count = Number(countRes.rows[0]?.count ?? 0);
      if (this.headOnly) {
        return ok(null, count);
      }
      const data = await this.fetchData(mainCols, relatedSpecs, whereSql, params, columnsMeta);
      return ok(data, count);
    }

    const data = await this.fetchData(mainCols, relatedSpecs, whereSql, params, columnsMeta);
    return ok(this.applySingle(data));
  }

  private async fetchData(
    mainCols: string[],
    relatedSpecs: Array<{ table: string; columns: string | null; pkCol: string }>,
    whereSql: string,
    params: unknown[],
    columnsMeta: Map<string, TableColumn>
  ): Promise<unknown> {
    const quotedMain = mainCols.map((c) => `"${c}"`);
    const pkCol = (columnsMeta.get("id") ? "id" : mainCols[0]) || "id";
    const selectList = [...quotedMain, `"${pkCol}" AS "__pk"`].join(", ");

    let sql = `SELECT ${selectList} FROM "${this.table}" ${whereSql}`;

    const mainOrders = this.orders.filter((o) => !o.referencedTable);
    if (mainOrders.length) {
      sql += ` ORDER BY ${mainOrders.map((o) => this.orderSql(o)).join(", ")}`;
    }
    if (this.limitValue !== null) sql += ` LIMIT ${this.limitValue}`;
    if (this.offsetValue !== null) sql += ` OFFSET ${this.offsetValue}`;

    const res = await this.pool.query(sql, params);

    const rows = (res.rows as Array<Record<string, unknown>>).map((row) => {
      const next: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (k === "__pk") continue;
        next[k] = normalizeValue(v, columnsMeta.get(unquoteIdentifier(k)));
      }
      return next;
    });

    // Nested related tables.
    if (relatedSpecs.length > 0 && rows.length > 0) {
      const pks = (res.rows as Array<Record<string, unknown>>).map((r) => r.__pk);
      for (const rel of relatedSpecs) {
        const childCols = rel.columns ? rel.columns.split(",").map((c) => c.trim()) : null;
        const childMeta = await getTableColumns(rel.table);
        const join = await findJoinColumn(rel.table, this.table);
        if (!join) continue;
        const childOrders = this.orders.filter((o) => o.referencedTable === rel.table);
        const orderSql = childOrders.length ? ` ORDER BY ${childOrders.map((o) => this.orderSql(o)).join(", ")}` : "";
        const allChildCols = childCols ? childCols : [...childMeta.keys()];
        const selectChild = [...allChildCols.map((c) => `"${c}"`), `"${join.childColumn}" AS "__fk"`].join(", ");
        const fkUdt = childMeta.get(join.childColumn)?.udt || "text";

        const childRes = await this.pool.query(
          `SELECT ${selectChild} FROM "${rel.table}" WHERE "${join.childColumn}" = ANY($1::${fkUdt}[])${orderSql}`,
          [pks]
        );

        const pkIndex = (res.rows as Array<Record<string, unknown>>).reduce((acc, row, i) => {
          acc.set(String(row.__pk), i);
          return acc;
        }, new Map<string, number>());

        for (const child of childRes.rows as Array<Record<string, unknown>>) {
          const parentIndex = pkIndex.get(String(child.__fk));
          if (parentIndex === undefined) continue;
          const parent = rows[parentIndex] as Record<string, unknown>;
          const normalizedChild: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(child)) {
            if (k === "__fk") continue;
            normalizedChild[k] = normalizeValue(v, childMeta.get(unquoteIdentifier(k)));
          }
          if (!Array.isArray(parent[rel.table])) parent[rel.table] = [];
          (parent[rel.table] as Array<Record<string, unknown>>).push(normalizedChild);
        }

        // Empty arrays for related tables with no matches.
        for (const row of rows as Array<Record<string, unknown>>) {
          if (!Array.isArray(row[rel.table])) row[rel.table] = [];
        }
      }
    }

    return rows;
  }

  private applySingle(data: unknown): unknown {
    if (!this.singleMode) return data;
    const rows = data as Array<Record<string, unknown>>;
    if (rows.length === 0) {
      if (this.singleMode === "single") throw new ErrorWithCode("JSON object requested, multiple (or no) rows returned.", "PGRST116", "The result contains 0 rows");
      return null;
    }
    if (rows.length > 1 && this.singleMode === "single") {
      throw new ErrorWithCode("JSON object requested, multiple (or no) rows returned.", "PGRST116", "The result contains more than one row");
    }
    return rows[0];
  }

  private orderSql(o: OrderSpec): string {
    const dir = o.ascending ? "ASC" : "DESC";
    const nulls = o.nullsFirst === undefined ? "" : o.nullsFirst ? " NULLS FIRST" : " NULLS LAST";
    return `"${o.col}" ${dir}${nulls}`;
  }

  private async buildWhere(
    table: string,
    columnsMeta: Map<string, TableColumn>
  ): Promise<{ whereSql: string; params: unknown[] }> {
    const params: unknown[] = [];
    const clauses: string[] = [];

    for (const f of this.filters) {
      if (f.op === "or") {
        const groups = f.value as Array<{ col: string; op: FilterOperator; value: unknown }>;
        const groupSql: string[] = [];
        for (const g of groups) {
          if (!g) continue;
          const sql = this.singleFilterSql(table, columnsMeta, g.col, g.op, g.value, params);
          groupSql.push(sql);
        }
        if (groupSql.length) clauses.push(`(${groupSql.join(" OR ")})`);
        continue;
      }
      if (f.op === "is") {
        if (f.value === null) clauses.push(`"${f.col}" IS NULL`);
        else if (f.value === "__NOT_NULL__") clauses.push(`"${f.col}" IS NOT NULL`);
        else clauses.push(`"${f.col}" IS $${params.length + 1}`);
        if (f.value !== null && f.value !== "__NOT_NULL__") params.push(f.value);
        continue;
      }
      if (f.op === "not") {
        const sql = this.singleFilterSql(table, columnsMeta, f.col, "eq", f.value, params);
        clauses.push(`NOT (${sql})`);
        continue;
      }
      clauses.push(this.singleFilterSql(table, columnsMeta, f.col, f.op, f.value, params));
    }

    return {
      whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
      params,
    };
  }

  private singleFilterSql(
    table: string,
    columnsMeta: Map<string, TableColumn>,
    col: string,
    op: FilterOperator,
    value: unknown,
    params: unknown[]
  ): string {
    const meta = columnsMeta.get(col);
    const isUuid = meta?.udt === "uuid";

    if (op === "in") {
      const values = value as unknown[];
      if (!values || values.length === 0) return "1 = 0";
      params.push(values);
      return isUuid ? `"${col}" = ANY($${params.length}::uuid[])` : `"${col}" = ANY($${params.length})`;
    }

    const idx = params.length + 1;
    params.push(value);
    switch (op) {
      case "eq":
        return `"${col}" = $${idx}`;
      case "neq":
        return `"${col}" <> $${idx}`;
      case "gt":
        return `"${col}" > $${idx}`;
      case "gte":
        return `"${col}" >= $${idx}`;
      case "lt":
        return `"${col}" < $${idx}`;
      case "lte":
        return `"${col}" <= $${idx}`;
      case "ilike":
        return `"${col}" ILIKE $${idx}`;
      case "like":
        return `"${col}" LIKE $${idx}`;
      default:
        return `"${col}" = $${idx}`;
    }
  }

  // ── INSERT / UPSERT ────────────────────────────────────────────────────

  /** RETURNING column list when `.select()` was called on a write. */
  private returningSql(): string {
    return this.returning === "*"
      ? "*"
      : this.returning!.split(",").map((c) => `"${c.trim()}"`).join(", ");
  }

  private async runInsert(mode: "insert" | "upsert"): Promise<QueryResult> {
    if (this.insertRows.length === 0) return ok(null);
    const columnsMeta = await getTableColumns(this.table);

    const allKeys = new Set<string>();
    for (const row of this.insertRows) {
      for (const key of Object.keys(row)) allKeys.add(key);
    }
    const keys = [...allKeys];
    if (keys.length === 0) return ok(null);

    const colSql = keys.map((k) => `"${k}"`).join(", ");

    // Build a single multi-row VALUES statement with a shared parameter list.
    const flatValues: unknown[] = [];
    const placeholders: string[] = [];
    for (const row of this.insertRows) {
      const rowPlaceholders: string[] = [];
      for (const key of keys) {
        const meta = columnsMeta.get(key);
        const value = this.serializeValue(meta, row[key]);
        rowPlaceholders.push(`$${flatValues.length + 1}`);
        flatValues.push(value);
      }
      placeholders.push(`(${rowPlaceholders.join(", ")})`);
    }

    let sql = `INSERT INTO "${this.table}" (${colSql}) VALUES ${placeholders.join(", ")}`;

    if (mode === "upsert" && this.onConflict) {
      const updateCols = keys.filter((k) => k !== this.onConflict && !["created_at"].includes(k));
      if (updateCols.length > 0) {
        sql += ` ON CONFLICT ("${this.onConflict}") DO UPDATE SET ${updateCols
          .map((k) => `"${k}" = EXCLUDED."${k}"`)
          .join(", ")}`;
      } else {
        sql += ` ON CONFLICT ("${this.onConflict}") DO NOTHING`;
      }
    }

    // `.insert().select()` — return the written rows (mirrors update/delete).
    if (this.returning) sql += ` RETURNING ${this.returningSql()}`;

    return this.runWithReturning(sql, flatValues);
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────

  private async runUpdate(): Promise<QueryResult> {
    const columnsMeta = await getTableColumns(this.table);
    const keys = Object.keys(this.updateData).filter((k) => this.updateData[k] !== undefined);
    if (keys.length === 0) {
      // No-op update — return success with data when select requested.
      const { whereSql, params } = await this.buildWhere(this.table, columnsMeta);
      if (this.returning) {
        const sql = `SELECT ${this.returningSql()} FROM "${this.table}" ${whereSql}`;
        const res = await this.pool.query(sql, params);
        return ok(this.applySingle(res.rows));
      }
      return ok(null);
    }

    const setSql: string[] = [];
    const params: unknown[] = [];
    for (const key of keys) {
      setSql.push(`"${key}" = $${params.length + 1}`);
      params.push(this.serializeValue(columnsMeta.get(key), this.updateData[key]));
    }
    const { whereSql, params: whereParams } = await this.buildWhere(this.table, columnsMeta);
    const allParams = [...params, ...whereParams];
    const where = whereSql.replace(/\$\d+/g, (m) => `$${Number(m.slice(1)) + params.length}`);

    let sql = `UPDATE "${this.table}" SET ${setSql.join(", ")} ${where}`;

    if (this.returning) sql += ` RETURNING ${this.returningSql()}`;
    return this.runWithReturning(sql, allParams, true);
  }

  // ── DELETE ─────────────────────────────────────────────────────────────

  private async runDelete(): Promise<QueryResult> {
    const columnsMeta = await getTableColumns(this.table);
    const { whereSql, params } = await this.buildWhere(this.table, columnsMeta);
    let sql = `DELETE FROM "${this.table}" ${whereSql}`;
    if (this.returning) sql += ` RETURNING ${this.returningSql()}`;
    return this.runWithReturning(sql, params, true);
  }

  private async runWithReturning(sql: string, params: unknown[], forceDataNull = false): Promise<QueryResult> {
    const res = await this.pool.query(sql, params);
    if (this.returning) {
      const rows = res.rows as Array<Record<string, unknown>>;
      const columnsMeta = await getTableColumns(this.table);
      const normalized = rows.map((row) => {
        const next: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          next[k] = normalizeValue(v, columnsMeta.get(k));
        }
        return next;
      });
      return ok(this.applySingle(normalized));
    }
    return ok(forceDataNull ? null : null);
  }

  private serializeValue(meta: TableColumn | undefined, value: unknown): unknown {
    if (value === undefined) return null;
    if (value === null) return null;
    if (isJsonType(meta?.udt || "")) {
      return typeof value === "string" ? value : JSON.stringify(value);
    }
    if (isArrayUdt(meta?.udt || "") && Array.isArray(value)) {
      return value;
    }
    if (value instanceof Date) {
      return isDateType(meta?.udt || "") ? value.toISOString().slice(0, 10) : value.toISOString();
    }
    return value;
  }
}

class ErrorWithCode extends Error {
  code: string;
  details: string;
  constructor(message: string, code: string, details: string) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function parseOrValue(raw: string): unknown {
  const v = raw.trim();
  if (v === "null") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  const match = v.match(/^\d+(\.\d+)?$/);
  if (match) return Number(v);
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  return v;
}

/** Public client type (drop-in for the previous client type). */
export type DbClient<Schema = unknown> = PostgresClient<Schema>;

/** Resolve the Row type for a table name from the Database schema. */
type RowFor<Schema, Name extends string> = unknown extends Schema
  ? never
  : Schema extends { public: { Tables: infer T } }
    ? Name extends keyof T
      ? T[Name] extends { Row: infer R }
        ? R
        : never
      : never
    : never;

/**
 * Top-level client factory. Call `.from("table")` to start a query.
 * Mirrors the chainable query surface the app was built against.
 */
export class PostgresClient<Schema = unknown> {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool ?? getPool();
  }

  from<Name extends string>(table: Name): PostgresQueryBuilder<RowFor<Schema, Name>> {
    return new PostgresQueryBuilder<RowFor<Schema, Name>>(table, this.pool);
  }
}
