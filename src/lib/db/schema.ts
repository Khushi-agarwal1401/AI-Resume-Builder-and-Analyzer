import { getPool } from "./connection";

/**
 * Lightweight Postgres schema introspection with an in-memory cache.
 * Used by the query builder to serialize parameters correctly (jsonb vs
 * text[] vs timestamps) and to resolve `related(*)` joins via foreign keys.
 */

export interface TableColumn {
  name: string;
  udt: string; // e.g. "jsonb", "text", "_text" (array), "timestamptz", "date"
  dataType: string; // e.g. "jsonb", "ARRAY", "timestamp with time zone"
}

interface ForeignKey {
  fromTable: string; // referencing (child) table
  fromColumn: string; // column on the referencing (child) table
  referencedTable: string;
  referencedColumn: string;
}

const columnCache = new Map<string, Map<string, TableColumn>>();
const fkCache = new Map<string, ForeignKey[]>();

export function isArrayUdt(udt: string): boolean {
  return udt.startsWith("_");
}

export function isJsonType(udt: string): boolean {
  return udt === "json" || udt === "jsonb";
}

export function isDateType(udt: string): boolean {
  return udt === "date";
}

/** Fetch + cache the columns of a table (public schema). */
export async function getTableColumns(table: string): Promise<Map<string, TableColumn>> {
  const cached = columnCache.get(table);
  if (cached) return cached;

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT column_name AS name, udt_name AS udt, data_type AS "dataType"
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );

  const map = new Map<string, TableColumn>();
  for (const row of rows as Array<{ name: string; udt: string; dataType: string }>) {
    map.set(row.name, {
      name: row.name,
      udt: row.udt,
      dataType: row.dataType,
    });
  }
  columnCache.set(table, map);
  return map;
}

/** Foreign keys that reference a given table's primary key. */
export async function getForeignKeysForTable(table: string): Promise<ForeignKey[]> {
  const cached = fkCache.get(table);
  if (cached) return cached;

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
        tc.table_name        AS "fromTable",
        kcu.column_name      AS "fromColumn",
        ccu.table_name       AS "referencedTable",
        ccu.column_name      AS "referencedColumn"
     FROM information_schema.table_constraints AS tc
     JOIN information_schema.key_column_usage AS kcu
       ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
     JOIN information_schema.constraint_column_usage AS ccu
       ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND ccu.table_schema = 'public'
       AND ccu.table_name = $1`,
    [table]
  );

  const fks: ForeignKey[] = (rows as Array<{ fromTable: string; fromColumn: string; referencedTable: string; referencedColumn: string }>).map(
    (r) => ({
      fromTable: r.fromTable,
      fromColumn: r.fromColumn,
      referencedTable: r.referencedTable,
      referencedColumn: r.referencedColumn,
    })
  );
  fkCache.set(table, fks);
  return fks;
}

/** Find the child column that links `child` to `parent` (e.g. user_id → profiles.id). */
export async function findJoinColumn(
  child: string,
  parent: string
): Promise<{ childColumn: string; parentColumn: string } | null> {
  const fks = await getForeignKeysForTable(parent);
  const match = fks.find((fk) => fk.fromTable === child);
  if (!match) return null;
  return { childColumn: match.fromColumn, parentColumn: match.referencedColumn };
}

export function invalidateSchemaCache(): void {
  columnCache.clear();
  fkCache.clear();
}
