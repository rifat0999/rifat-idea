// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDatabase, createUser, queryAs } from "./test-database";

// Covers the three tightened read rules: social channels, platform settings and brand profiles.
let db: PGlite;
const u = {} as Record<
  | "admin"
  | "noRole"
  | "brandReviewer"
  | "brandBooked"
  | "brandChatting"
  | "brandStranger"
  | "creatorPartner"
  | "creatorOther"
  | "creatorHidden",
  string
>;
const creator = {} as Record<"partner" | "other" | "hidden", string>;

async function creatorProfileId(userId: string) {
  const { rows } = await db.query<{ id: string }>(
    "select id from public.creator_profiles where user_id = $1",
    [userId],
  );
  return rows[0].id;
}

beforeAll(async () => {
  db = await createTestDatabase();

  u.admin = await createUser(db, "Admin", "admin");
  u.noRole = await createUser(db, "No Role Yet");
  u.brandReviewer = await createUser(db, "Reviewer Brand", "business");
  u.brandBooked = await createUser(db, "Booked Brand", "business");
  u.brandChatting = await createUser(db, "Chatting Brand", "business");
  u.brandStranger = await createUser(db, "Stranger Brand", "business");
  u.creatorPartner = await createUser(db, "Partner Creator", "creator");
  u.creatorOther = await createUser(db, "Other Creator", "creator");
  u.creatorHidden = await createUser(db, "Hidden Creator", "creator");

  creator.partner = await creatorProfileId(u.creatorPartner);
  creator.other = await creatorProfileId(u.creatorOther);
  creator.hidden = await creatorProfileId(u.creatorHidden);

  await db.query(
    "update public.creator_profiles set is_published = true where id = any($1::uuid[])",
    [[creator.partner, creator.other]],
  );
  await db.query(
    `insert into public.creator_socials (creator_id, platform, handle) values
       ($1, 'instagram', 'partner_live'), ($2, 'tiktok', 'hidden_draft')`,
    [creator.partner, creator.hidden],
  );
  await db.query(
    "insert into public.bookings (business_id, creator_id, title, amount_bdt) values ($1, $2, 'Eid reel', 5000)",
    [u.brandBooked, creator.partner],
  );
  await db.query("insert into public.conversations (business_id, creator_id) values ($1, $2)", [
    u.brandChatting,
    creator.partner,
  ]);
  await db.query(
    "insert into public.reviews (creator_id, business_id, rating) values ($1, $2, 5)",
    [creator.other, u.brandReviewer],
  );
});

describe("Social channels", () => {
  const handles = async (viewer: string | null) =>
    (
      await queryAs<{ handle: string }>(db, viewer, "select handle from public.creator_socials")
    ).map((r) => r.handle);

  it("signed-out visitors see channels of published creators only", async () => {
    const seen = await handles(null);
    expect(seen).toContain("partner_live");
    expect(seen).not.toContain("hidden_draft");
  });

  it("an unpublished creator still sees their own channels", async () => {
    expect(await handles(u.creatorHidden)).toContain("hidden_draft");
  });

  it("other signed-in users do not see an unpublished creator's channels", async () => {
    expect(await handles(u.creatorOther)).not.toContain("hidden_draft");
    expect(await handles(u.brandBooked)).not.toContain("hidden_draft");
  });

  it("admins see channels of unpublished creators", async () => {
    expect(await handles(u.admin)).toEqual(
      expect.arrayContaining(["partner_live", "hidden_draft"]),
    );
  });
});

describe("Platform settings (commission and payment instructions)", () => {
  const settings = (viewer: string | null) =>
    queryAs<{ commission_rate: string }>(
      db,
      viewer,
      "select commission_rate from public.platform_settings",
    );

  it("signed-out visitors are refused", async () => {
    await expect(settings(null)).rejects.toThrow(/permission denied/);
  });

  it("signed-in users without an account type get nothing", async () => {
    expect(await settings(u.noRole)).toHaveLength(0);
  });

  it("brands, creators and admins can read them", async () => {
    for (const viewer of [u.brandStranger, u.creatorOther, u.admin]) {
      expect(await settings(viewer)).toHaveLength(1);
    }
  });
});

describe("Brand profiles", () => {
  const visibleBrands = async (viewer: string | null) =>
    (
      await queryAs<{ user_id: string }>(db, viewer, "select user_id from public.business_profiles")
    ).map((r) => r.user_id);

  it("signed-out visitors see only brands that left a review", async () => {
    const seen = await visibleBrands(null);
    expect(seen).toContain(u.brandReviewer);
    expect(seen).not.toContain(u.brandBooked);
    expect(seen).not.toContain(u.brandChatting);
    expect(seen).not.toContain(u.brandStranger);
  });

  it("a brand sees its own profile but not unrelated brands", async () => {
    const seen = await visibleBrands(u.brandStranger);
    expect(seen).toContain(u.brandStranger);
    expect(seen).not.toContain(u.brandBooked);
    expect(seen).not.toContain(u.brandChatting);
  });

  it("a creator sees brands they have a booking or a chat with", async () => {
    const seen = await visibleBrands(u.creatorPartner);
    expect(seen).toContain(u.brandBooked);
    expect(seen).toContain(u.brandChatting);
    expect(seen).not.toContain(u.brandStranger);
  });

  it("a creator with no booking or chat does not see those brands", async () => {
    const seen = await visibleBrands(u.creatorOther);
    expect(seen).not.toContain(u.brandBooked);
    expect(seen).not.toContain(u.brandChatting);
    expect(seen).not.toContain(u.brandStranger);
  });

  it("admins see every brand", async () => {
    expect(await visibleBrands(u.admin)).toEqual(
      expect.arrayContaining([u.brandReviewer, u.brandBooked, u.brandChatting, u.brandStranger]),
    );
  });
});
