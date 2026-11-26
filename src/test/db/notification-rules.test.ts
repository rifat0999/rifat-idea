// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDatabase, createUser, queryAs } from "./test-database";

let db: PGlite;
let brand = "";
let creator = "";
let admin = "";
let stranger = "";
let profile = "";
let booking = "";
let request = "";
let payment = "";
type Alert = { id: string; user_id: string; category: string; old_status: string; new_status: string; created_at: string; read_at: string | null };
function firstId(rows: { id: string }[]) {
  const id = rows[0]?.id;
  if (!id) throw new Error("Missing fixture");
  return id;
}

async function statusChange(sql: string, params: string[], actor = admin) {
  await db.exec("begin; delete from public.notifications");
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: actor })]);
    await db.exec("set local role authenticated");
    await db.query(sql, params);
    await db.exec("reset role");
    return (await db.query<Alert>("select * from public.notifications order by user_id")).rows;
  } finally {
    await db.exec("rollback");
  }
}

beforeAll(async () => {
  db = await createTestDatabase();
  brand = await createUser(db, "Notify Brand", "business");
  creator = await createUser(db, "Notify Creator", "creator");
  admin = await createUser(db, "Notify Admin", "admin");
  stranger = await createUser(db, "Notify Stranger", "business");
  profile = firstId((await db.query<{ id: string }>("select id from public.creator_profiles where user_id = $1", [creator])).rows);
  await db.query("update public.creator_profiles set is_published = true where id = $1", [profile]);
  request = firstId((await db.query<{ id: string }>("insert into public.verification_requests(user_id, kind) values ($1,'creator') returning id", [creator])).rows);
  booking = firstId((await db.query<{ id: string }>("insert into public.bookings(business_id,creator_id,title,amount_bdt) values ($1,$2,'Notification test reel',5000) returning id", [brand, profile])).rows);
  await db.query("update public.bookings set status = 'accepted' where id = $1", [booking]);
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: brand })]);
  payment = firstId((await db.query<{ id: string }>("insert into public.payments(booking_id,business_id,amount_bdt,method,transaction_ref) values ($1,$2,5000,'bkash','NOTIFY1234') returning id", [booking, brand])).rows);
  await db.query("select set_config('request.jwt.claims', '', false)");
});
afterAll(async () => { if (db) await db.close(); });

describe("Status-change notification delivery", () => {
  it("notifies only the creator once when their verification request is approved", async () => {
    const alerts = await statusChange("update public.verification_requests set status='approved' where id=$1", [request]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ user_id: creator, category: "verification", old_status: "pending", new_status: "verified" });
  });
  it("notifies only the brand when its verification status changes", async () => {
    const alerts = await statusChange("update public.business_profiles set verification_status='verified' where user_id=$1", [brand]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ user_id: brand, category: "verification", old_status: "unverified", new_status: "verified" });
  });
  it("notifies both booking parties and records status and time", async () => {
    const alerts = await statusChange("update public.bookings set status='in_progress' where id=$1", [booking]);
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.user_id).sort()).toEqual([brand, creator].sort());
    for (const alert of alerts) {
      expect(alert).toMatchObject({ category: "booking", old_status: "accepted", new_status: "in_progress", read_at: null });
      expect(Number.isNaN(Date.parse(alert.created_at))).toBe(false);
    }
  });
  it("notifies both parties only once each after a payment review synchronizes the booking", async () => {
    const alerts = await statusChange("update public.payments set status='verified' where id=$1", [payment]);
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.user_id).sort()).toEqual([brand, creator].sort());
    expect(alerts.every((a) => a.category === "payment" && a.old_status === "submitted" && a.new_status === "verified")).toBe(true);
  });
  it("also notifies both parties when payout status changes directly", async () => {
    const alerts = await statusChange("update public.bookings set payment_status='released' where id=$1", [booking]);
    expect(alerts).toHaveLength(2);
    expect(alerts.every((a) => a.category === "payment" && a.new_status === "released")).toBe(true);
  });
  it("does not notify for unchanged statuses or unrelated edits", async () => {
    expect(await statusChange("update public.bookings set status='accepted', title='Updated reel title' where id=$1", [booking])).toEqual([]);
  });
});

describe("Private notification access", () => {
  it("brands and creators can read only their own alerts", async () => {
    for (const viewer of [brand, creator]) {
      const alerts = await queryAs<Alert>(db, viewer, "select * from public.notifications");
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every((alert) => alert.user_id === viewer)).toBe(true);
    }
  });
  it("unrelated users and admins cannot read someone else's alerts", async () => {
    expect(await queryAs(db, stranger, "select * from public.notifications")).toEqual([]);
    expect(await queryAs(db, admin, "select * from public.notifications")).toEqual([]);
  });
  it("signed-out visitors cannot read alerts", async () => {
    await expect(queryAs(db, null, "select * from public.notifications")).rejects.toThrow(/permission denied/);
  });
  it("recipients can mark their alerts read", async () => {
    const alerts = await queryAs<Alert>(db, brand, "update public.notifications set read_at=now() returning *");
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((a) => a.user_id === brand && a.read_at !== null)).toBe(true);
  });
  it("recipients cannot mark someone else's alert read", async () => {
    expect(await queryAs(db, brand, `update public.notifications set read_at=now() where user_id='${creator}' returning id`)).toEqual([]);
  });
  it("clients cannot change notification contents or recipient", async () => {
    await expect(queryAs(db, brand, "update public.notifications set new_status='completed'")).rejects.toThrow(/permission denied/);
    await expect(queryAs(db, brand, `update public.notifications set user_id='${stranger}'`)).rejects.toThrow(/permission denied/);
  });
  it("clients cannot fabricate or delete alerts", async () => {
    await expect(queryAs(db, brand, `insert into public.notifications(user_id,category,entity_id,entity_label,old_status,new_status) values ('${brand}','booking','${booking}','Fake','pending','completed')`)).rejects.toThrow(/permission denied/);
    await expect(queryAs(db, brand, "delete from public.notifications")).rejects.toThrow(/permission denied/);
  });
});