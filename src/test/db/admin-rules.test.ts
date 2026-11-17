// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDatabase, createUser, queryAs } from "./test-database";

// Covers the admin dashboard rules: user list, admin access, campaigns, verification and bookings.
let db: PGlite;
const u = {} as Record<"admin" | "brand" | "otherBrand" | "creator" | "noRole", string>;
let creatorProfile = "";
let campaign = "";
let booking = "";
let request = "";

/** Run several statements as one signed-in user, then roll everything back. */
async function asUser<T>(viewer: string, steps: () => Promise<T>) {
  await db.exec("begin");
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: viewer, role: "authenticated" }),
    ]);
    await db.exec("set local role authenticated");
    return await steps();
  } finally {
    await db.exec("rollback");
  }
}

beforeAll(async () => {
  db = await createTestDatabase();
  u.admin = await createUser(db, "Admin", "admin");
  u.brand = await createUser(db, "Brand One", "business");
  u.otherBrand = await createUser(db, "Brand Two", "business");
  u.creator = await createUser(db, "Creator One", "creator");
  u.noRole = await createUser(db, "No Role");

  creatorProfile = (
    await db.query<{ id: string }>("select id from public.creator_profiles where user_id = $1", [u.creator])
  ).rows[0]!.id;
  await db.query("update public.creator_profiles set is_published = true where id = $1", [creatorProfile]);
  campaign = (
    await db.query<{ id: string }>(
      "insert into public.campaigns (business_id, title) values ($1, 'Eid launch') returning id",
      [u.brand],
    )
  ).rows[0]!.id;
  booking = (
    await db.query<{ id: string }>(
      "insert into public.bookings (business_id, creator_id, title, amount_bdt) values ($1, $2, 'Eid reel', 5000) returning id",
      [u.brand, creatorProfile],
    )
  ).rows[0]!.id;
  request = (
    await db.query<{ id: string }>(
      "insert into public.verification_requests (user_id, kind) values ($1, 'creator') returning id",
      [u.creator],
    )
  ).rows[0]!.id;
});

describe("User list", () => {
  it("admins see every account with its email", async () => {
    const rows = await queryAs<{ email: string }>(db, u.admin, "select email from public.admin_list_users()");
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.email)).toContain("brand.one@test.local");
  });

  it.each(["brand", "creator", "noRole"] as const)("a %s account is refused", async (who) => {
    await expect(queryAs(db, u[who], "select * from public.admin_list_users()")).rejects.toThrow(/Admins only/);
  });

  it("signed-out visitors are refused", async () => {
    await expect(queryAs(db, null, "select * from public.admin_list_users()")).rejects.toThrow(/permission denied/);
  });
});

describe("Admin access", () => {
  it("an admin can make another account an admin", async () => {
    const admin = await asUser(u.admin, async () => {
      await db.query("select public.admin_set_admin($1, true)", [u.brand]);
      const { rows } = await db.query<{ admin: boolean }>("select public.has_role($1, 'admin') as admin", [u.brand]);
      return rows[0]?.admin;
    });
    expect(admin).toBe(true);
  });

  it("a non-admin cannot give anyone admin access", async () => {
    await expect(
      queryAs(db, u.brand, `select public.admin_set_admin('${u.brand}', true)`),
    ).rejects.toThrow(/Admins only/);
  });

  it("an admin cannot remove their own admin access", async () => {
    await expect(
      queryAs(db, u.admin, `select public.admin_set_admin('${u.admin}', false)`),
    ).rejects.toThrow(/your own admin access/);
  });
});

describe("Campaigns", () => {
  const cancel = (viewer: string) =>
    queryAs<{ status: string }>(
      db,
      viewer,
      `update public.campaigns set status = 'cancelled' where id = '${campaign}' returning status`,
    );

  it("an admin can change any brand's campaign status", async () => {
    expect(await cancel(u.admin)).toEqual([{ status: "cancelled" }]);
  });

  it("another brand cannot change it", async () => {
    expect(await cancel(u.otherBrand)).toEqual([]);
  });
});

describe("Verification requests", () => {
  it("an admin approving a request verifies the creator's profile", async () => {
    const status = await asUser(u.admin, async () => {
      await db.query("update public.verification_requests set status = 'approved' where id = $1", [request]);
      const { rows } = await db.query<{ verification_status: string }>(
        "select verification_status from public.creator_profiles where id = $1",
        [creatorProfile],
      );
      return rows[0]?.verification_status;
    });
    expect(status).toBe("verified");
  });

  it("the creator cannot approve their own request", async () => {
    const rows = await queryAs(
      db,
      u.creator,
      `update public.verification_requests set status = 'approved' where id = '${request}' returning id`,
    );
    expect(rows).toEqual([]);
  });
});

describe("Bookings", () => {
  it("an admin sees every booking and can change its status", async () => {
    const rows = await queryAs<{ status: string }>(
      db,
      u.admin,
      `update public.bookings set status = 'cancelled' where id = '${booking}' returning status`,
    );
    expect(rows).toEqual([{ status: "cancelled" }]);
  });

  it("an unrelated brand cannot see the booking", async () => {
    const rows = await queryAs(db, u.otherBrand, "select id from public.bookings");
    expect(rows).toEqual([]);
  });
});
