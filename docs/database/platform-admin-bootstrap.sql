-- Run once through an authorized database console after migrations.
-- Replace the UUID with an existing, trusted users.id value.
-- Do not expose this operation through a public signup endpoint.
INSERT INTO platform_admins (user_id, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', TRUE)
ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE;
