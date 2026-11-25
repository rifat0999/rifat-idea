// @vitest-environment node
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestDatabase, createUser, queryAs } from "./test-database";

let db: PGlite;
const u = {} as Record<
  "admin" | "reviewer" | "stranger" | "publishedCreator" | "hiddenCreator",
  string
>;
const review = {} as Record<"published" | "hidden", string>;

async function creatorProfileId(userId: string) {
  const { rows } = await db.query<{ id: string }>(
    "select id from public.creator_profiles where user_id = $1",
    [userId],
  );
  const row = rows[0];
  if (!row) throw new Error(`No creator profile for ${userId}`);
  return row.id;
}

beforeAll(async () => {
  db = await createTestDatabase();

  u.admin = await createUser(db, "Review Admin", "admin");
  u.reviewer = await createUser(db, "Review Writer", "business");
  u.stranger = await createUser(db, "Review Stranger", "business");
  u.publishedCreator = await createUser(db, "Published Review Creator", "creator");
  u.hiddenCreator = await createUser(db, "Hidden Review Creator", "creator");

  const publishedCreatorId = await creatorProfileId(u.publishedCreator);
  const hiddenCreatorId = await creatorProfileId(u.hiddenCreator);
  await db.query("update public.creator_profiles set is_published = true where id = $1", [
    publishedCreatorId,
  ]);

  const { rows } = await db.query<{ id: string; comment: string }>(
    `insert into public.reviews (creator_id, business_id, rating, comment) values
       ($1, $3, 5, 'published-review'),
       ($2, $3, 4, 'hidden-review')
     returning id, comment`,
    [publishedCreatorId, hiddenCreatorId, u.reviewer],
  );
  for (const row of rows) {
    if (row.comment === "published-review") review.published = row.id;
    if (row.comment === "hidden-review") review.hidden = row.id;
  }
});

describe("Review visibility", () => {
  const visibleReviewIds = async (viewer: string | null) =>
    (await queryAs<{ id: string }>(db, viewer, "select id from public.reviews")).map(
      (row) => row.id,
    );

  it("signed-out visitors see reviews for published creators only", async () => {
    const visible = await visibleReviewIds(null);
    expect(visible).toContain(review.published);
    expect(visible).not.toContain(review.hidden);
  });

  it("unrelated signed-in users cannot see reviews for unpublished creators", async () => {
    const visible = await visibleReviewIds(u.stranger);
    expect(visible).toContain(review.published);
    expect(visible).not.toContain(review.hidden);
  });

  it("the reviewing brand can still read its review of an unpublished creator", async () => {
    expect(await visibleReviewIds(u.reviewer)).toContain(review.hidden);
  });

  it("an unpublished creator can still read reviews on their own profile", async () => {
    expect(await visibleReviewIds(u.hiddenCreator)).toContain(review.hidden);
  });

  it("admins can read reviews for both published and unpublished creators", async () => {
    expect(await visibleReviewIds(u.admin)).toEqual(
      expect.arrayContaining([review.published, review.hidden]),
    );
  });
});
