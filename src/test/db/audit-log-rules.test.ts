// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDatabase, createUser, queryAs } from "./test-database";

let db: PGlite;
const u = {} as Record<"admin" | "brand" | "creator" | "stranger", string>;
let creatorProfile = "";
let request = "";
let booking = "";
let payment = "";

type AuditEntry = {
  actor_id: string | null;
  category: string;
  entity_type: string;
  entity_label: string;
  status_field: string;
  old_status: string | null;
  new_status: string;
};

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

async function auditEntries() {
  const { rows } = await db.query<AuditEntry>(
    `select actor_id, category, entity_type, entity_label, status_field, old_status, new_status
     from public.admin_audit_logs order by created_at, id`,
  );
  return rows;
}

beforeAll(async () => {
  db = await createTestDatabase();
  u.admin = await createUser(db, "Audit Admin", "admin");
  u.brand = await createUser(db, "Audit Brand", "business");
  u.creator = await createUser(db, "Audit Creator", "creator");
  u.stranger = await createUser(db, "Audit Stranger", "business");

  creatorProfile = (
    await db.query<{ id: string }>("select id from public.creator_profiles where user_id = $1", [u.creator])
  ).rows[0]!.id;
  await db.query("update public.creator_profiles set is_published = true where id = $1", [creatorProfile]);
  request = (
    await db.query<{ id: string }>(
      "insert into public.verification_requests (user_id, kind) values ($1, 'creator') returning id",
      [u.creator],
    )
  ).rows[0]!.id;
  booking = (
    await db.query<{ id: string }>(
      "insert into public.bookings (business_id, creator_id, title, amount_bdt) values ($1, $2, 'Audit campaign reel', 5000) returning id",
      [u.brand, creatorProfile],
    )
  ).rows[0]!.id;
  await db.query("update public.bookings set status = 'accepted' where id = $1", [booking]);
  payment = (
    await db.query<{ id: string }>(
      `insert into public.payments (booking_id, business_id, amount_bdt, method, transaction_ref)
       values ($1, $2, 5000, 'bkash', 'AUDIT1234') returning id`,
      [booking, u.brand],
    )
  ).rows[0]!.id;
  await db.query("delete from public.admin_audit_logs");
});

describe("Automatic status history", () => {
  it("records who approved verification and the resulting profile verification", async () => {
    const entries = await asUser(u.admin, async () => {
      await db.query("update public.verification_requests set status = 'approved' where id = $1", [request]);
      return auditEntries();
    });

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor_id: u.admin,
          category: "verification",
          entity_type: "verification_request",
          old_status: "pending",
          new_status: "approved",
        }),
        expect.objectContaining({
          actor_id: u.admin,
          category: "verification",
          entity_type: "creator_profile",
          entity_label: "Audit Creator",
          old_status: "pending",
          new_status: "verified",
        }),
      ]),
    );
  });

  it("records the admin, booking, previous status, new status and time", async () => {
    const entry = await asUser(u.admin, async () => {
      await db.query("update public.bookings set status = 'in_progress' where id = $1", [booking]);
      const { rows } = await db.query<AuditEntry & { created_at: string }>(
        `select actor_id, category, entity_type, entity_label, status_field, old_status, new_status, created_at
         from public.admin_audit_logs where entity_id = $1 and status_field = 'status'`,
        [booking],
      );
      return rows[0];
    });

    expect(entry).toEqual(
      expect.objectContaining({
        actor_id: u.admin,
        category: "booking",
        entity_type: "booking",
        entity_label: "Audit campaign reel",
        old_status: "accepted",
        new_status: "in_progress",
      }),
    );
    if (!entry) throw new Error("No booking audit entry was recorded");
    expect(Number.isNaN(Date.parse(entry.created_at))).toBe(false);
  });

  it("attributes a booking cancellation to the brand that made it", async () => {
    const entries = await asUser(u.brand, async () => {
      const { rows } = await db.query<{ id: string }>(
        "insert into public.bookings (business_id, creator_id, title, amount_bdt) values ($1, $2, 'Cancel this reel', 3000) returning id",
        [u.brand, creatorProfile],
      );
      const newBooking = rows[0]!.id;
      await db.query("update public.bookings set status = 'cancelled' where id = $1", [newBooking]);
      return auditEntries();
    });

    expect(entries).toContainEqual(
      expect.objectContaining({ actor_id: u.brand, old_status: "pending", new_status: "cancelled" }),
    );
  });

  it("records both payment review and the related booking payment state", async () => {
    const entries = await asUser(u.admin, async () => {
      await db.query("update public.payments set status = 'verified' where id = $1", [payment]);
      return auditEntries();
    });

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor_id: u.admin,
          entity_type: "payment",
          old_status: "submitted",
          new_status: "verified",
        }),
        expect.objectContaining({
          actor_id: u.admin,
          entity_type: "booking",
          status_field: "payment_status",
          old_status: "submitted",
          new_status: "verified",
        }),
      ]),
    );
  });

  it("does not create an entry when a tracked status did not change", async () => {
    const entries = await asUser(u.admin, async () => {
      await db.query("update public.bookings set status = 'accepted' where id = $1", [booking]);
      return auditEntries();
    });
    expect(entries).toEqual([]);
  });
});

describe("Audit history access", () => {
  it("admins can read the history but cannot edit it", async () => {
    expect(await queryAs(db, u.admin, "select id from public.admin_audit_logs")).toEqual([]);
    await expect(
      queryAs(db, u.admin, "update public.admin_audit_logs set entity_label = 'Changed'"),
    ).rejects.toThrow(/permission denied/);
  });

  it("non-admin accounts get no audit entries", async () => {
    expect(await queryAs(db, u.stranger, "select id from public.admin_audit_logs")).toEqual([]);
  });

  it("signed-out visitors and direct client writes are refused", async () => {
    await expect(queryAs(db, null, "select id from public.admin_audit_logs")).rejects.toThrow(/permission denied/);
    await expect(
      queryAs(
        db,
        u.admin,
        `insert into public.admin_audit_logs (category, entity_type, entity_id, entity_label, status_field, new_status)
         values ('booking', 'booking', '${booking}', 'Fake entry', 'status', 'completed')`,
      ),
    ).rejects.toThrow(/permission denied/);
  });
});
