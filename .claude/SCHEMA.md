You are connected to a PostgreSQL database (Supabase) with the following schema.

Schema: public
Version: latest (based on CSV column inventory dump)
Purpose: Manage running courses, comments, photos, categories, and admin settings.

---

TABLE: access_links

- id (uuid, pk, default gen_random_uuid())
- access_code (varchar)
- is_active (boolean, default true)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
- kakao_user_id (varchar, unique)
- kakao_nickname (varchar)
- kakao_profile_url (text)

TABLE: admin

- id (uuid, pk, default gen_random_uuid())
- username (varchar, unique)
- password_hash (varchar)
- created_at (timestamptz, default now())
- last_login_at (timestamptz)

TABLE: app_settings

- id (uuid, pk, default gen_random_uuid())
- setting_key (varchar, unique)
- setting_value (jsonb)

TABLE: course_categories

- id (uuid, pk, default gen_random_uuid())
- key (varchar, unique)
- name (varchar)
- sort_order (integer, default 0)
- is_active (boolean, default true)
- created_at (timestamptz, default now())
- description (text)
- cover_image_url (text)

TABLE: courses

- id (uuid, pk, default gen_random_uuid())
- title (varchar)
- description (text)
- start_latitude (double precision)
- start_longitude (double precision)
- distance_km (numeric)
- avg_time_min (integer)
- difficulty (varchar, default 'medium')
- is_active (boolean, default true)
- created_at (timestamptz, default now())
- elevation_gain (integer, default 0)
- gpx_data (jsonb)
- category_id (uuid, fk → course_categories.id)
- cover_image_url (text)
- updated_at (timestamptz, default now())
- tags (jsonb, default [])
- sort_order (integer, default 0)
- detail_description (text)

TABLE: course_comments

- id (uuid, pk, default gen_random_uuid())
- course_id (uuid, fk → courses.id)
- author_nickname (varchar)
- message (text)
- created_at (timestamptz, default now())
- likes_count (integer, default 0)
- avatar_url (text)
- author_user_key (text)
- edited_at (timestamptz)
- is_deleted (boolean, default false)
- is_flagged (boolean, default false)
- hidden_by_admin (boolean, default false)
- latitude (numeric)
- longitude (numeric)
- distance_marker (numeric)
- is_visible_in_flight (boolean, default true)

TABLE: course_comment_photos

- id (uuid, pk, default gen_random_uuid())
- comment_id (uuid, fk → course_comments.id)
- file_url (text)
- sort_order (integer, default 0)
- created_at (timestamptz, default now())

TABLE: course_photos

- id (uuid, pk, default gen_random_uuid())
- course_id (uuid, fk → courses.id)
- user_id (text)
- file_url (text)
- caption (text)
- created_at (timestamptz, default now())

TABLE: course_location_notes

- id (uuid, pk, default gen_random_uuid())
- course_id (uuid, fk → courses.id)
- latitude (double precision)
- longitude (double precision)
- title (varchar)
- content (text)
- memo_type (varchar, default 'general', CHECK: ['general','warning','highlight','rest'])
- created_at (timestamptz, default now())
- is_active (boolean, default true)
- show_during_animation (boolean, default true)
- route_index (integer)

TABLE: edge_functions_metadata

- id (uuid, pk, default gen_random_uuid())
- name (text, unique)
- description (text)
- endpoint (text)
- created_at (timestamptz, default now())

TABLE: spatial_ref_sys

- srid (integer, pk, CHECK 0 < srid ≤ 998999)
- auth_name (varchar)
- auth_srid (integer)
- srtext (varchar)
- proj4text (varchar)

---

Relationships:

- courses.category_id → course_categories.id
- course_comments.course_id → courses.id
- course_comment_photos.comment_id → course_comments.id
- course_photos.course_id → courses.id
- course_location_notes.course_id → courses.id

---

Context hint:
Use this schema to write SQL queries, generate Prisma schemas, or document ER diagrams.
