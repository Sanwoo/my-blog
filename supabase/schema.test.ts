import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaSql = readFileSync(join(process.cwd(), "supabase/schema.sql"), "utf8");

describe("Supabase interaction notification schema", () => {
  it("uses explicit RPC functions for interaction writes", () => {
    expect(schemaSql).toContain("CREATE FUNCTION create_comment_with_interaction_notification");
    expect(schemaSql).toContain("CREATE FUNCTION toggle_comment_like_with_interaction_notification");
    expect(schemaSql).toContain("CREATE FUNCTION toggle_post_reaction_with_interaction_notification");
    expect(schemaSql).toContain("CREATE FUNCTION get_unread_interaction_summary");
    expect(schemaSql).toContain("GRANT EXECUTE ON FUNCTION create_comment_with_interaction_notification(uuid, uuid, uuid, text) TO service_role");
    expect(schemaSql).toContain("GRANT EXECUTE ON FUNCTION toggle_post_reaction_with_interaction_notification(text, uuid) TO service_role");
    expect(schemaSql).toContain("GRANT EXECUTE ON FUNCTION get_unread_interaction_summary(uuid) TO service_role");
  });

  it("does not keep notification generation triggers or direct write policies", () => {
    expect(schemaSql).not.toContain("create_interaction_comment_notification");
    expect(schemaSql).not.toContain("sync_comment_like_notification");
    expect(schemaSql).not.toContain("sync_post_reaction_notification");
    expect(schemaSql).not.toContain("interaction_comment_insert");
    expect(schemaSql).not.toContain("comment_like_notifications_sync");
    expect(schemaSql).not.toContain("post_reaction_notifications_sync");
    expect(schemaSql).not.toContain("comments_insert_authenticated");
    expect(schemaSql).not.toContain("comment_likes_manage_self");
    expect(schemaSql).not.toContain("post_reactions_manage_self");
  });

  it("keeps idempotency indexes and metric triggers", () => {
    expect(schemaSql).toContain("idx_interaction_notifications_post_comment_unique");
    expect(schemaSql).toContain("idx_interaction_notifications_comment_like_unique");
    expect(schemaSql).toContain("idx_interaction_notifications_post_reaction_unique");
    expect(schemaSql).toContain("CREATE TRIGGER comments_metrics_sync");
    expect(schemaSql).toContain("CREATE TRIGGER reactions_metrics_sync");
    expect(schemaSql).toContain("like_count integer NOT NULL DEFAULT 0");
    expect(schemaSql).toContain("CREATE TRIGGER comment_likes_count_sync");
    expect(schemaSql).toContain("idx_posts_author_updated");
    expect(schemaSql).toContain("idx_posts_public_category_published");
    expect(schemaSql).toContain("idx_interaction_notifications_recipient_unread_kind");
  });
});
