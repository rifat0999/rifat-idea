import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Offline Postgres for access-rule tests. It recreates the small parts of the hosted
 * backend the migrations rely on (anon/authenticated roles, auth.users, auth.uid()),
 * then applies every real migration in drizzle/migrations in journal order.
 */
const MIGRATIONS_DIR = path.resolve(__dirname, "../../../drizzle/migrations");

const HOSTED_BACKEND_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  grant usage on schema public to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    last_sign_in_at timestamptz,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  create publication supabase_realtime;
`;

export async function createTestDatabase() {
  const db = new PGlite();
  await db.exec(HOSTED_BACKEND_STUB);
  const journal = JSON.parse(
    readFileSync(path.join(MIGRATIONS_DIR, "meta/_journal.json"), "utf8"),
  ) as {
    entries: { tag: string }[];
  };
  for (const { tag } of journal.entries) {
    await db.exec(readFileSync(path.join(MIGRATIONS_DIR, `${tag}.sql`), "utf8"));
  }
  return db;
}

/** A signed-in user id, or null for a signed-out visitor. */
export type Viewer = string | null;

/** Run one query as a signed-out visitor or a signed-in user, then roll everything back. */
export async function queryAs<T = Record<string, unknown>>(
  db: PGlite,
  viewer: Viewer,
  sql: string,
) {
  await db.exec("begin");
  try {
    if (viewer) {
      await db.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: viewer, role: "authenticated" }),
      ]);
      await db.exec("set local role authenticated");
    } else {
      await db.exec("set local role anon");
    }
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec("rollback");
  }
}

/** Create an account the way sign-up does; role metadata triggers the normal account setup. */
export async function createUser(
  db: PGlite,
  name: string,
  role?: "business" | "creator" | "admin",
) {
  const meta = role && role !== "admin" ? { role, full_name: name } : { full_name: name };
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [`${name.toLowerCase().replace(/\W+/g, ".")}@test.local`, JSON.stringify(meta)],
  );
  const id = rows[0]?.id;
  if (!id) throw new Error(`Could not create test user ${name}`);
  if (role === "admin") {
    await db.query("insert into public.user_roles (user_id, role) values ($1, 'admin')", [id]);
  }
  return id;
}
