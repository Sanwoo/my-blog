-- Full coverage seed for the current blog app.
-- Assumes a fresh database created from supabase/schema.sql.
--
-- Covers:
-- 1. Author + multiple reader accounts
-- 2. 10 monthly published notes using the same HTML article body at different times
-- 3. A target post with 4 older + 4 newer neighbors for the left rail
-- 4. Mixed content modes: HTML, Tiptap JSON, and a no-TOC article
-- 5. Scheduled + draft posts for editor/preview testing
-- 6. Taxonomy management cases: active, archived, long-label, and no-tag posts
-- 7. Published working copy data for editor update-preview testing
-- 8. Image nodes, top-level comments, nested replies, hidden comments, likes, reactions, and interaction notifications
-- 9. Latest comments rail excluding comments on non-public posts
--
-- Recommended detail-page test slugs:
-- - monthly-note-2025-10-anxiety-creativity
-- - dashboard-saas-notes-json
-- - quiet-day-without-headings
-- - editor-taxonomy-working-copy
-- - image-rich-json-editor-test
-- - many-tags-layout-stress
-- - archived-taxonomy-history

BEGIN;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '55555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'you@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Sanwoo"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666661',
    'authenticated',
    'authenticated',
    'reader.one@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Reader One"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666662',
    'authenticated',
    'authenticated',
    'reader.two@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Reader Two"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666663',
    'authenticated',
    'authenticated',
    'reader.three@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Reader Three"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-4666-8666-666666666664',
    'authenticated',
    'authenticated',
    'reader.four@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Reader Four"}'::jsonb,
    now(),
    now()
  );

INSERT INTO profiles (
  id,
  display_name,
  handle,
  role,
  display_name_customized
) VALUES
  ('55555555-5555-4555-8555-555555555555', 'Sanwoo', '@sanwoo', 'author', true),
  ('66666666-6666-4666-8666-666666666661', 'Reader One', '@readerone', 'reader', false),
  ('66666666-6666-4666-8666-666666666662', 'Reader Two', '@readertwo', 'reader', false),
  ('66666666-6666-4666-8666-666666666663', 'Reader Three', '@readerthree', 'reader', false),
  ('66666666-6666-4666-8666-666666666664', 'Reader Four', '@readerfour', 'reader', false);

INSERT INTO post_categories (id, name, slug) VALUES
  ('11000000-0000-4000-8000-000000000001', 'Essays', 'essays'),
  ('11000000-0000-4000-8000-000000000002', 'Product', 'product'),
  ('11000000-0000-4000-8000-000000000003', 'Engineering', 'engineering'),
  ('11000000-0000-4000-8000-000000000004', 'Notes', 'notes');

INSERT INTO post_categories (id, name, slug, archived_at) VALUES
  ('11000000-0000-4000-8000-000000000005', 'Design', 'design', null),
  ('11000000-0000-4000-8000-000000000006', 'Operations', 'operations', null),
  ('11000000-0000-4000-8000-000000000007', 'Archived Lab', 'archived-lab', '2026-04-20T09:00:00+08:00');

INSERT INTO post_tags (id, name, slug) VALUES
  ('12000000-0000-4000-8000-000000000001', 'monthly', 'monthly'),
  ('12000000-0000-4000-8000-000000000002', 'journal', 'journal'),
  ('12000000-0000-4000-8000-000000000003', 'life', 'life'),
  ('12000000-0000-4000-8000-000000000004', 'hackathon', 'hackathon'),
  ('12000000-0000-4000-8000-000000000005', 'product', 'product'),
  ('12000000-0000-4000-8000-000000000006', 'ai', 'ai'),
  ('12000000-0000-4000-8000-000000000007', 'side-project', 'side-project'),
  ('12000000-0000-4000-8000-000000000008', 'afilmory', 'afilmory'),
  ('12000000-0000-4000-8000-000000000009', 'saas', 'saas'),
  ('12000000-0000-4000-8000-000000000010', 'research', 'research'),
  ('12000000-0000-4000-8000-000000000011', 'mrr', 'mrr'),
  ('12000000-0000-4000-8000-000000000012', 'anxiety', 'anxiety'),
  ('12000000-0000-4000-8000-000000000013', 'game', 'game'),
  ('12000000-0000-4000-8000-000000000014', 'work', 'work'),
  ('12000000-0000-4000-8000-000000000015', 'loneliness', 'loneliness'),
  ('12000000-0000-4000-8000-000000000016', 'archive', 'archive'),
  ('12000000-0000-4000-8000-000000000017', 'future', 'future'),
  ('12000000-0000-4000-8000-000000000018', 'json', 'json'),
  ('12000000-0000-4000-8000-000000000019', 'dashboard', 'dashboard'),
  ('12000000-0000-4000-8000-000000000020', 'plain', 'plain'),
  ('12000000-0000-4000-8000-000000000021', 'no-toc', 'no-toc'),
  ('12000000-0000-4000-8000-000000000022', 'test', 'test'),
  ('12000000-0000-4000-8000-000000000023', 'scheduled', 'scheduled'),
  ('12000000-0000-4000-8000-000000000024', 'draft', 'draft'),
  ('12000000-0000-4000-8000-000000000025', 'editor', 'editor'),
  ('12000000-0000-4000-8000-000000000026', 'html-render', 'html-render'),
  ('12000000-0000-4000-8000-000000000027', 'preview', 'preview');

INSERT INTO post_tags (id, name, slug, archived_at) VALUES
  ('12000000-0000-4000-8000-000000000028', 'writing', 'writing', null),
  ('12000000-0000-4000-8000-000000000029', 'taxonomy', 'taxonomy', null),
  ('12000000-0000-4000-8000-000000000030', 'image', 'image', null),
  ('12000000-0000-4000-8000-000000000031', 'working-copy', 'working-copy', null),
  ('12000000-0000-4000-8000-000000000032', 'mobile', 'mobile', null),
  ('12000000-0000-4000-8000-000000000033', 'long-label-for-wrapping-tests', 'long-label-for-wrapping-tests', null),
  ('12000000-0000-4000-8000-000000000034', 'seo', 'seo', null),
  ('12000000-0000-4000-8000-000000000035', 'archived-tag', 'archived-tag', '2026-04-20T09:00:00+08:00');

WITH note_template AS (
  SELECT
    '是一个月。我想以后尽量保证每个月能写一篇手记，至少记录一下自己的生活历程。虽然我的生活依旧混乱而枯燥，状态也并不算好，未来的变数更是大得让人不安。'::text AS excerpt,
    '月度手记：记录黑客马拉松、Afilmory、游戏、工作焦虑与生活里的不安。'::text AS seo_description,
    $html$
      <p>是一个月。我想以后尽量保证每个月能写一篇手记，至少记录一下自己的生活历程。虽然我的生活依旧混乱而枯燥，状态也并不算好，未来的变数更是大得让人不安。总之，又是在焦虑之中。那就慢慢说来吧。</p>

      <h2>黑客马拉松：从灵感爆发到现实落差</h2>
      <p>有了 AI 之后，很多想法能更快落地。这种速度有时候让人觉得久违的兴奋，像是突然抓住一根绳子，可以朝某个方向继续拉下去。</p>
      <p>上上个月提到我正打算重写 Mix Space，项目其实已经开了头，但因为其他更“重要”的项目，又不得不先搁置一段时间。所谓重要，其实也都还是 side project。怎么让这些项目变现，我现在也仍在探索中。</p>
      <p>前些天和厂长进行了一段时间的黑客马拉松，突然的想法是复刻一个 trustMRR，但是基于 App Connection 的数据。原因也很简单：还没人做，然后 trustMRR 上线几天就赚了不少钱，我们想尽快做出来。</p>
      <p>最后的结果是，由于前期没有调研清楚，导致最后不了了之。虽然现在还是上线了 Apple MRR，但效果没有预期的那么好。不过这次确实吸取了经验：调研真的很重要，不然好几晚的熬夜就白费了。</p>
      <p>不过现在用 AI 做 UI 确实越来越快了，Apple 的设计花了不久就搞出来了。只是再强的 AI 也只是加速器，细节部分还是得靠人去打磨。</p>

      <h2>Afilmory：被迫加速的一场追赶之战</h2>
      <p>我现在最主要在做的项目还是 afilmory。前段日子，这个项目被抄了 UI，然后做了一个 Nuxt 版本的带 server 的实现。我感觉到有点压力了。原本我是不想做 server 的，这下不得不做了。</p>
      <p>花了两周的业余时间指挥 AI，把整个 dashboard 加 server 写出来了，我是完全按照 SaaS 去设计的。代码目前是开源的，但是应该不会写任何文档。我想通过 SaaS 的中心化方式，让更多人通过一个实例管理更多的 afilmory，后面就可以做一个大众的画廊。当然这个服务从 day 1 开始就注定不会是 Free 的。</p>
      <p><strong>Afilmory</strong> 2479。Modern photo gallery for photographers, with S3/GitHub sync, EXIF details, maps, and a WebGL viewer.</p>
      <p>基础功能算是 ready 了，但还不够上线。dashboard 采用 Linear design language，web 则是 Glassmorphic Depth Design System。不过 web 的 UI 后面应该还会再进行一波大改，我不太想让别人轻易抄过去继续用。</p>

      <h2>羊蹄山之魂：逃离现实的一段旅程</h2>
      <p>《羊蹄山之魂》这个游戏真的挺好玩。前作对马岛我也通关了，但最近对比了一下，其实感觉完全是两款不同的游戏。除了美术一致，玩法几乎全改了。打击感更好，花样更多，完全没有罐头味，而且风景绝美。</p>
      <p>目前我玩了三十多个小时，刚到第二章。每次做任务时都会被狐狸或金鸟吸引跑偏，总之主线完全不着急。等我通关之后，也许能再深入聊一聊。</p>

      <h2>人生和变数</h2>
      <p>最近又因为工作的事情焦虑，遇到一些调整，可能年前要重新找工作了。如果有合适的机会也可以推荐一下。对于工作稳定这件事还是太难了，总是会遇到意想不到的变数。</p>
      <p>有时候我会突然停下来，想一想自己现在的生活轨迹：重复、枯燥、像是在原地绕圈，怎么走都走不出既定的范围。</p>
      <p>意义感这种东西，好像越来越难抓住。偶尔甚至会觉得未来的路，不知道该通往哪儿。</p>
      <p>还有那个静悄悄的孤独，一直都在。不是喧闹的悲伤，而是一种温度很低的空白，让人意识到很多时候我确实是一个人在走。</p>
      <p>想到父母终会老去，而我可能只能陪他们走完最后一段路，就会突然涌起一种说不出口的无力感。甚至偶尔也会浮现一个念头：等他们离开之后，我好像也不会再有什么必须坚持下去的理由。</p>
    $html$::text AS content_html
),
monthly_seed AS (
  SELECT *
  FROM (
    VALUES
      ('21000000-0000-4000-8000-000000000001'::uuid, 'monthly-note-2025-05-keep-moving', '2025年5月手记：在焦虑里继续做事', '2025-05-26T20:00:00+08:00'::timestamptz, 'Essays', '["monthly","journal","life"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000002'::uuid, 'monthly-note-2025-06-hackathon-gap', '2025年6月手记：黑客马拉松与现实落差', '2025-06-28T21:00:00+08:00'::timestamptz, 'Notes', '["monthly","hackathon","product"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000003'::uuid, 'monthly-note-2025-07-ai-side-projects', '2025年7月手记：AI 加速与 side project', '2025-07-27T22:00:00+08:00'::timestamptz, 'Product', '["monthly","ai","side-project"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000004'::uuid, 'monthly-note-2025-08-afilmory-pressure', '2025年8月手记：Afilmory 的追赶之战', '2025-08-30T19:30:00+08:00'::timestamptz, 'Engineering', '["monthly","afilmory","saas"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000005'::uuid, 'monthly-note-2025-09-do-research-first', '2025年9月手记：做产品也要先做调研', '2025-09-28T18:40:00+08:00'::timestamptz, 'Product', '["monthly","research","mrr"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000006'::uuid, 'monthly-note-2025-10-anxiety-creativity', '2025年10月手记：在混乱里记录生活', '2025-10-27T21:15:00+08:00'::timestamptz, 'Essays', '["monthly","life","anxiety"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000007'::uuid, 'monthly-note-2025-11-ghost-of-yotei', '2025年11月手记：羊蹄山之魂与逃离现实', '2025-11-29T20:20:00+08:00'::timestamptz, 'Notes', '["monthly","game","life"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000008'::uuid, 'monthly-note-2025-12-work-and-loneliness', '2025年12月手记：工作、孤独与变数', '2025-12-29T22:10:00+08:00'::timestamptz, 'Essays', '["monthly","work","loneliness"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000009'::uuid, 'monthly-note-2026-01-save-a-record', '2026年1月手记：给生活留一份存档', '2026-01-29T21:45:00+08:00'::timestamptz, 'Notes', '["monthly","archive","life"]'::jsonb, 9),
      ('21000000-0000-4000-8000-000000000010'::uuid, 'monthly-note-2026-02-keep-going', '2026年2月手记：在不安里继续往前', '2026-02-26T20:50:00+08:00'::timestamptz, 'Essays', '["monthly","future","anxiety"]'::jsonb, 9)
  ) AS t(id, slug, title, published_at, category, tags, read_time_minutes)
)
INSERT INTO posts (
  id,
  slug,
  title,
  excerpt,
  content_json,
  content_html,
  category_id,
  status,
  seo_description,
  published_at,
  created_at,
  updated_at,
  read_time_minutes,
  author_id
)
SELECT
  monthly_seed.id,
  monthly_seed.slug,
  monthly_seed.title,
  note_template.excerpt,
  null,
  note_template.content_html,
  (SELECT id FROM post_categories WHERE slug = lower(monthly_seed.category)),
  'published'::post_status,
  note_template.seo_description,
  monthly_seed.published_at,
  monthly_seed.published_at,
  monthly_seed.published_at,
  monthly_seed.read_time_minutes,
  '55555555-5555-4555-8555-555555555555'::uuid
FROM monthly_seed
CROSS JOIN note_template;

INSERT INTO posts (
  id,
  slug,
  title,
  excerpt,
  content_json,
  content_html,
  category_id,
  status,
  seo_description,
  published_at,
  created_at,
  updated_at,
  read_time_minutes,
  author_id
) VALUES
  (
    '21000000-0000-4000-8000-000000000011',
    'dashboard-saas-notes-json',
    'Dashboard 与 SaaS：把一次追赶做成长期结构',
    '一篇使用 content_json 的公开文章，用来测试 JSON 渲染路径与 TOC。',
    '{
      "type":"doc",
      "content":[
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"为什么要做 dashboard"}]},
        {"type":"paragraph","content":[{"type":"text","text":"这篇文章专门用来测试公开详情页走 content_json 渲染时，正文、目录和阅读进度是否正常。"}]},
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"中心化的 SaaS 结构"}]},
        {"type":"paragraph","content":[{"type":"text","text":"它模拟的是一个从静态展示转向 SaaS dashboard 的产品思路，适合测试多级标题和正文段落。"}]},
        {"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"画廊与管理后台"}]},
        {"type":"paragraph","content":[{"type":"text","text":"这个 JSON 内容会直接被渲染器转换为 HTML，并生成对应的目录锚点。"}]}
      ]
    }'::jsonb,
    '',
    '11000000-0000-4000-8000-000000000003',
    'published',
    '一篇使用 content_json 的公开文章，用来测试 JSON 渲染路径与 TOC。',
    '2026-03-18T20:30:00+08:00',
    '2026-03-18T20:30:00+08:00',
    '2026-03-18T20:30:00+08:00',
    6,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000012',
    'quiet-day-without-headings',
    '没有标题节点的一天',
    '这篇文章只有段落，没有 heading，用来测试详情页目录为空时的情况。',
    null,
    '<p>这是一篇只有正文段落、没有任何标题节点的测试文章。</p><p>它应该正常显示正文，但目录组件应完全不渲染。</p><p>同时它仍然会出现在时间线、RSS 和 sitemap 中。</p>',
    '11000000-0000-4000-8000-000000000001',
    'published',
    '这篇文章只有段落，没有 heading，用来测试详情页目录为空时的情况。',
    '2026-03-29T09:20:00+08:00',
    '2026-03-29T09:20:00+08:00',
    '2026-03-29T09:20:00+08:00',
    3,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000013',
    'scheduled-note-future-release',
    '计划中的手记：未来再写',
    '一篇未来时间的 scheduled 文章，用来测试其不会出现在公开页面、RSS 与 sitemap 中。',
    null,
    '<h2>还没发布</h2><p>这篇文章用于测试 scheduled 状态。</p>',
    '11000000-0000-4000-8000-000000000004',
    'scheduled',
    '一篇未来时间的 scheduled 文章，用来测试其不会出现在公开页面、RSS 与 sitemap 中。',
    '2026-12-12T10:00:00+08:00',
    '2026-04-01T10:00:00+08:00',
    '2026-04-01T10:00:00+08:00',
    2,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000014',
    'draft-note-json',
    '草稿：还没写完的产品想法',
    '一篇 draft + content_json 的文章，用来测试作者写作台和预览页。',
    '{
      "type":"doc",
      "content":[
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"草稿想法"}]},
        {"type":"paragraph","content":[{"type":"text","text":"这是一篇只给作者看的草稿文章，用来测试编辑器和预览页。"}]}
      ]
    }'::jsonb,
    '',
    '11000000-0000-4000-8000-000000000002',
    'draft',
    '一篇 draft + content_json 的文章，用来测试作者写作台和预览页。',
    null,
    '2026-04-02T11:00:00+08:00',
    '2026-04-02T11:00:00+08:00',
    2,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000015',
    'draft-note-html-render',
    '草稿：HTML 正文渲染样例',
    '一篇 draft + content_html 的文章，用来测试作者预览页对 HTML 内容格式的渲染。',
    null,
    '<h2 id="html-render">HTML 正文渲染</h2><p>这是一篇使用 content_html 的草稿文章。</p><h3 id="second-part">第二部分</h3><p>预览页应当仍然能生成目录并正常渲染。</p>',
    '11000000-0000-4000-8000-000000000003',
    'draft',
    '一篇 draft + content_html 的文章，用来测试作者预览页对 HTML 内容格式的渲染。',
    null,
    '2026-04-03T14:00:00+08:00',
    '2026-04-03T14:00:00+08:00',
    3,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000016',
    'editor-taxonomy-working-copy',
    '写作台改造：分类、标签和未公开修改',
    '一篇已发布但带 working copy 的文章，用来测试写作台暂存修改、分类标签选择和发布更新。',
    '{
      "type":"doc",
      "content":[
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"为什么要把分类和标签做成数据库对象"}]},
        {"type":"paragraph","content":[{"type":"text","text":"如果分类只是一个字符串，写作台就无法稳定地重命名、归档，也很难在文章详情和首页统计之间保持一致。"}]},
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"未公开修改"}]},
        {"type":"paragraph","content":[{"type":"text","text":"这篇文章会有一份 working copy，用来验证保存修改后公开页面仍显示原文，而作者预览显示未发布版本。"}]}
      ]
    }'::jsonb,
    '',
    '11000000-0000-4000-8000-000000000006',
    'published',
    '测试写作台分类、标签和 working copy 的文章。',
    '2026-04-05T10:20:00+08:00',
    '2026-04-05T10:20:00+08:00',
    '2026-04-05T10:20:00+08:00',
    4,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000017',
    'image-rich-json-editor-test',
    '带图片节点的 JSON 正文测试',
    '这篇文章包含 Tiptap image 节点，用于测试编辑器上传图片、预览渲染和详情页响应式图片样式。',
    '{
      "type":"doc",
      "content":[
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"图片节点"}]},
        {"type":"paragraph","content":[{"type":"text","text":"下面这张图使用站内公开资源，方便在 fresh seed 后直接验证 figure、alt 和图片边框样式。"}]},
        {"type":"image","attrs":{"src":"/me.jpg","alt":"作者头像测试图","title":"作者头像测试图","caption":"站内图片节点渲染测试"}},
        {"type":"paragraph","content":[{"type":"text","text":"移动端应保持等比缩放，PC 端不应撑破正文宽度。"}]}
      ]
    }'::jsonb,
    '',
    '11000000-0000-4000-8000-000000000005',
    'published',
    '包含图片节点的 JSON 正文，用于测试写作台图片能力。',
    '2026-04-07T21:00:00+08:00',
    '2026-04-07T21:00:00+08:00',
    '2026-04-07T21:00:00+08:00',
    3,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000018',
    'many-tags-layout-stress',
    '很多标签时，标题和标签应该优雅换行',
    '一篇拥有多个标签和长标签的文章，用于测试文章详情页、卡片、OG metadata 与移动端换行。',
    null,
    '<h2>标签很多的时候</h2><p>这篇文章故意挂了比较多的标签，其中包含很长的英文标签，用来观察移动端和窄栏布局是否会溢出。</p><p>分类、标签、日期、阅读时间应该保持清楚，不遮挡标题和摘要。</p>',
    '11000000-0000-4000-8000-000000000005',
    'published',
    '用于测试多标签和长标签换行的文章。',
    '2026-04-09T18:15:00+08:00',
    '2026-04-09T18:15:00+08:00',
    '2026-04-09T18:15:00+08:00',
    4,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000019',
    'no-tags-minimal-note',
    '没有标签的极简文章',
    '这篇文章不分配任何标签，用来测试详情页和卡片在空标签状态下是否自然。',
    null,
    '<p>不是每篇文章都需要标签。这个测试项确保空标签不会留下多余间距，也不会影响分类显示。</p>',
    '11000000-0000-4000-8000-000000000004',
    'published',
    '没有标签的极简文章，用来测试空标签状态。',
    '2026-04-10T08:10:00+08:00',
    '2026-04-10T08:10:00+08:00',
    '2026-04-10T08:10:00+08:00',
    1,
    '55555555-5555-4555-8555-555555555555'
  ),
  (
    '21000000-0000-4000-8000-000000000020',
    'archived-taxonomy-history',
    '归档分类和标签的历史文章',
    '这篇文章使用已归档分类与标签，用于测试历史文章仍可展示，但写作台选择器不再优先出现。',
    null,
    '<h2>历史分类</h2><p>归档不是删除。历史文章仍然应该能展示原有分类和标签，只是不再作为新文章的默认候选。</p>',
    '11000000-0000-4000-8000-000000000007',
    'published',
    '用于测试归档分类和归档标签展示的文章。',
    '2026-04-11T16:40:00+08:00',
    '2026-04-11T16:40:00+08:00',
    '2026-04-11T16:40:00+08:00',
    2,
    '55555555-5555-4555-8555-555555555555'
  );

WITH post_tags_seed(post_slug, tag_slug) AS (
  VALUES
    ('monthly-note-2025-05-keep-moving', 'monthly'),
    ('monthly-note-2025-05-keep-moving', 'journal'),
    ('monthly-note-2025-05-keep-moving', 'life'),
    ('monthly-note-2025-06-hackathon-gap', 'monthly'),
    ('monthly-note-2025-06-hackathon-gap', 'hackathon'),
    ('monthly-note-2025-06-hackathon-gap', 'product'),
    ('monthly-note-2025-07-ai-side-projects', 'monthly'),
    ('monthly-note-2025-07-ai-side-projects', 'ai'),
    ('monthly-note-2025-07-ai-side-projects', 'side-project'),
    ('monthly-note-2025-08-afilmory-pressure', 'monthly'),
    ('monthly-note-2025-08-afilmory-pressure', 'afilmory'),
    ('monthly-note-2025-08-afilmory-pressure', 'saas'),
    ('monthly-note-2025-09-do-research-first', 'monthly'),
    ('monthly-note-2025-09-do-research-first', 'research'),
    ('monthly-note-2025-09-do-research-first', 'mrr'),
    ('monthly-note-2025-10-anxiety-creativity', 'monthly'),
    ('monthly-note-2025-10-anxiety-creativity', 'life'),
    ('monthly-note-2025-10-anxiety-creativity', 'anxiety'),
    ('monthly-note-2025-11-ghost-of-yotei', 'monthly'),
    ('monthly-note-2025-11-ghost-of-yotei', 'game'),
    ('monthly-note-2025-11-ghost-of-yotei', 'life'),
    ('monthly-note-2025-12-work-and-loneliness', 'monthly'),
    ('monthly-note-2025-12-work-and-loneliness', 'work'),
    ('monthly-note-2025-12-work-and-loneliness', 'loneliness'),
    ('monthly-note-2026-01-save-a-record', 'monthly'),
    ('monthly-note-2026-01-save-a-record', 'archive'),
    ('monthly-note-2026-01-save-a-record', 'life'),
    ('monthly-note-2026-02-keep-going', 'monthly'),
    ('monthly-note-2026-02-keep-going', 'future'),
    ('monthly-note-2026-02-keep-going', 'anxiety'),
    ('dashboard-saas-notes-json', 'json'),
    ('dashboard-saas-notes-json', 'dashboard'),
    ('dashboard-saas-notes-json', 'saas'),
    ('quiet-day-without-headings', 'plain'),
    ('quiet-day-without-headings', 'no-toc'),
    ('quiet-day-without-headings', 'test'),
    ('scheduled-note-future-release', 'scheduled'),
    ('scheduled-note-future-release', 'test'),
    ('draft-note-json', 'draft'),
    ('draft-note-json', 'json'),
    ('draft-note-json', 'editor'),
    ('draft-note-html-render', 'draft'),
    ('draft-note-html-render', 'html-render'),
    ('draft-note-html-render', 'preview'),
    ('editor-taxonomy-working-copy', 'writing'),
    ('editor-taxonomy-working-copy', 'taxonomy'),
    ('editor-taxonomy-working-copy', 'working-copy'),
    ('image-rich-json-editor-test', 'image'),
    ('image-rich-json-editor-test', 'json'),
    ('image-rich-json-editor-test', 'editor'),
    ('many-tags-layout-stress', 'taxonomy'),
    ('many-tags-layout-stress', 'mobile'),
    ('many-tags-layout-stress', 'seo'),
    ('many-tags-layout-stress', 'long-label-for-wrapping-tests'),
    ('archived-taxonomy-history', 'archived-tag')
)
INSERT INTO post_tag_assignments (post_id, tag_id)
SELECT posts.id, post_tags.id
FROM post_tags_seed
JOIN posts ON posts.slug = post_tags_seed.post_slug
JOIN post_tags ON post_tags.slug = post_tags_seed.tag_slug;

INSERT INTO post_working_copies (
  post_id,
  slug,
  title,
  excerpt,
  content_json,
  content_html,
  category_id,
  status,
  seo_description,
  published_at,
  read_time_minutes,
  created_at,
  updated_at
) VALUES
  (
    '21000000-0000-4000-8000-000000000016',
    'editor-taxonomy-working-copy-v2',
    '写作台改造：未公开修改正在编辑中',
    '这是一份 working copy，公开页面应仍展示原始标题，作者编辑页和预览页应展示这份未公开修改。',
    '{
      "type":"doc",
      "content":[
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Working copy 正在生效"}]},
        {"type":"paragraph","content":[{"type":"text","text":"作者在写作台保存修改后，公开文章仍保持稳定；只有点击发布更新后，这份内容才会进入 posts 主表。"}]},
        {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"分类和标签仍然可编辑"}]},
        {"type":"paragraph","content":[{"type":"text","text":"这份 working copy 也有自己的分类和标签，用于测试 post_working_copy_tag_assignments。"}]}
      ]
    }'::jsonb,
    '',
    '11000000-0000-4000-8000-000000000005',
    'published',
    '未公开修改版本，用来测试发布更新工作流。',
    '2026-04-05T10:20:00+08:00',
    5,
    '2026-04-22T14:00:00+08:00',
    '2026-04-22T14:00:00+08:00'
  );

WITH working_copy_tags_seed(post_id, tag_slug) AS (
  VALUES
    ('21000000-0000-4000-8000-000000000016'::uuid, 'working-copy'),
    ('21000000-0000-4000-8000-000000000016'::uuid, 'taxonomy'),
    ('21000000-0000-4000-8000-000000000016'::uuid, 'mobile')
)
INSERT INTO post_working_copy_tag_assignments (post_id, tag_id)
SELECT working_copy_tags_seed.post_id, post_tags.id
FROM working_copy_tags_seed
JOIN post_tags ON post_tags.slug = working_copy_tags_seed.tag_slug;

INSERT INTO comments (
  id,
  post_id,
  author_id,
  parent_id,
  body,
  status,
  created_at,
  updated_at
) VALUES
  (
    '31000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000006',
    '66666666-6666-4666-8666-666666666661',
    null,
    '这篇十月手记很适合测试新详情页，左侧前后文和右侧目录都能看出层次感。',
    'published',
    '2026-04-18T08:30:00+08:00',
    '2026-04-18T08:30:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000006',
    '55555555-5555-4555-8555-555555555555',
    '31000000-0000-4000-8000-000000000001',
    '我也觉得这个版本更适合做详情页结构测试，信息密度比较平衡。',
    'published',
    '2026-04-18T09:00:00+08:00',
    '2026-04-18T09:00:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000003',
    '21000000-0000-4000-8000-000000000006',
    '66666666-6666-4666-8666-666666666662',
    null,
    'Afilmory 那一段非常适合观察长段落和目录滚动联动的体验。',
    'published',
    '2026-04-17T20:10:00+08:00',
    '2026-04-17T20:10:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000004',
    '21000000-0000-4000-8000-000000000006',
    '66666666-6666-4666-8666-666666666663',
    '31000000-0000-4000-8000-000000000003',
    '而且这篇里面有游戏、项目、工作、家庭几条线，读起来层次很明显。',
    'published',
    '2026-04-17T20:45:00+08:00',
    '2026-04-17T20:45:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000010',
    '21000000-0000-4000-8000-000000000006',
    '66666666-6666-4666-8666-666666666663',
    '31000000-0000-4000-8000-000000000002',
    '这条回复挂在二级评论下，用来验证评论区会扁平归并，并显示“回复 @某人”。',
    'published',
    '2026-04-18T09:30:00+08:00',
    '2026-04-18T09:30:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000005',
    '21000000-0000-4000-8000-000000000006',
    '66666666-6666-4666-8666-666666666664',
    null,
    '“等他们离开之后”这一段会把阅读速度放慢，很适合测试阅读进度百分比变化。',
    'published',
    '2026-04-16T22:40:00+08:00',
    '2026-04-16T22:40:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000006',
    '21000000-0000-4000-8000-000000000006',
    '66666666-6666-4666-8666-666666666661',
    null,
    '这条评论是隐藏的，不应该出现在详情页和首页最新评论里。',
    'hidden',
    '2026-04-15T20:20:00+08:00',
    '2026-04-15T20:20:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000007',
    '21000000-0000-4000-8000-000000000011',
    '66666666-6666-4666-8666-666666666662',
    null,
    'JSON 正文的目录节点也正常，高亮切换应该能覆盖到这篇。',
    'published',
    '2026-04-19T07:15:00+08:00',
    '2026-04-19T07:15:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000008',
    '21000000-0000-4000-8000-000000000012',
    '66666666-6666-4666-8666-666666666663',
    null,
    '没有标题的文章应该不显示目录，但评论区和互动区仍然正常。',
    'published',
    '2026-04-18T13:25:00+08:00',
    '2026-04-18T13:25:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000009',
    '21000000-0000-4000-8000-000000000013',
    '66666666-6666-4666-8666-666666666664',
    null,
    '这是一条挂在 scheduled 文章上的公开评论，用来验证首页最新评论不会泄露未来文章。',
    'published',
    '2026-04-19T08:00:00+08:00',
    '2026-04-19T08:00:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000011',
    '21000000-0000-4000-8000-000000000016',
    '66666666-6666-4666-8666-666666666661',
    null,
    '这篇适合测试已发布文章的未公开修改：公开页保持原文，写作台能看到 working copy。',
    'published',
    '2026-04-22T15:00:00+08:00',
    '2026-04-22T15:00:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000012',
    '21000000-0000-4000-8000-000000000016',
    '55555555-5555-4555-8555-555555555555',
    '31000000-0000-4000-8000-000000000011',
    '没错，这条回复也会进入互动消息，用来确认回复通知指向实际被回复的人。',
    'published',
    '2026-04-22T15:30:00+08:00',
    '2026-04-22T15:30:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000013',
    '21000000-0000-4000-8000-000000000017',
    '66666666-6666-4666-8666-666666666662',
    null,
    '图片节点在移动端应该自然缩放，alt 和正文间距也要稳定。',
    'published',
    '2026-04-23T08:40:00+08:00',
    '2026-04-23T08:40:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000014',
    '21000000-0000-4000-8000-000000000018',
    '66666666-6666-4666-8666-666666666663',
    null,
    '长标签换行和文章头部 chip 排列，可以用这篇在窄屏下重点看。',
    'published',
    '2026-04-23T09:20:00+08:00',
    '2026-04-23T09:20:00+08:00'
  ),
  (
    '31000000-0000-4000-8000-000000000015',
    '21000000-0000-4000-8000-000000000020',
    '66666666-6666-4666-8666-666666666664',
    null,
    '归档分类和归档标签不应出现在新建选择器，但历史文章仍然要能展示。',
    'published',
    '2026-04-23T10:00:00+08:00',
    '2026-04-23T10:00:00+08:00'
  );

UPDATE interaction_notifications
SET
  created_at = CASE reply_id
    WHEN '31000000-0000-4000-8000-000000000002' THEN '2026-04-18T09:00:00+08:00'::timestamptz
    WHEN '31000000-0000-4000-8000-000000000010' THEN '2026-04-18T09:30:00+08:00'::timestamptz
    WHEN '31000000-0000-4000-8000-000000000004' THEN '2026-04-17T20:45:00+08:00'::timestamptz
    WHEN '31000000-0000-4000-8000-000000000012' THEN '2026-04-22T15:30:00+08:00'::timestamptz
  END,
  read_at = CASE reply_id
    WHEN '31000000-0000-4000-8000-000000000004' THEN '2026-04-18T10:30:00+08:00'::timestamptz
    ELSE NULL
  END
WHERE reply_id IN (
  '31000000-0000-4000-8000-000000000002',
  '31000000-0000-4000-8000-000000000010',
  '31000000-0000-4000-8000-000000000004',
  '31000000-0000-4000-8000-000000000012'
);

INSERT INTO comment_likes (
  comment_id,
  user_id,
  created_at
) VALUES
  ('31000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666662', '2026-04-18T08:40:00+08:00'),
  ('31000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-666666666663', '2026-04-18T08:50:00+08:00'),
  ('31000000-0000-4000-8000-000000000003', '66666666-6666-4666-8666-666666666661', '2026-04-17T20:20:00+08:00'),
  ('31000000-0000-4000-8000-000000000004', '66666666-6666-4666-8666-666666666664', '2026-04-17T21:00:00+08:00'),
  ('31000000-0000-4000-8000-000000000007', '55555555-5555-4555-8555-555555555555', '2026-04-19T07:20:00+08:00'),
  ('31000000-0000-4000-8000-000000000011', '66666666-6666-4666-8666-666666666662', '2026-04-22T15:10:00+08:00'),
  ('31000000-0000-4000-8000-000000000011', '66666666-6666-4666-8666-666666666663', '2026-04-22T15:12:00+08:00'),
  ('31000000-0000-4000-8000-000000000013', '55555555-5555-4555-8555-555555555555', '2026-04-23T08:45:00+08:00'),
  ('31000000-0000-4000-8000-000000000013', '66666666-6666-4666-8666-666666666664', '2026-04-23T08:50:00+08:00'),
  ('31000000-0000-4000-8000-000000000014', '66666666-6666-4666-8666-666666666661', '2026-04-23T09:30:00+08:00'),
  ('31000000-0000-4000-8000-000000000015', '55555555-5555-4555-8555-555555555555', '2026-04-23T10:10:00+08:00');

INSERT INTO post_reactions (
  post_id,
  user_id,
  kind,
  created_at
) VALUES
  ('21000000-0000-4000-8000-000000000006', '66666666-6666-4666-8666-666666666661', 'appreciate', '2026-04-18T08:31:00+08:00'),
  ('21000000-0000-4000-8000-000000000006', '66666666-6666-4666-8666-666666666662', 'appreciate', '2026-04-18T08:32:00+08:00'),
  ('21000000-0000-4000-8000-000000000006', '66666666-6666-4666-8666-666666666663', 'appreciate', '2026-04-18T08:33:00+08:00'),
  ('21000000-0000-4000-8000-000000000006', '55555555-5555-4555-8555-555555555555', 'appreciate', '2026-04-18T08:34:00+08:00'),
  ('21000000-0000-4000-8000-000000000011', '66666666-6666-4666-8666-666666666661', 'appreciate', '2026-04-19T07:16:00+08:00'),
  ('21000000-0000-4000-8000-000000000011', '66666666-6666-4666-8666-666666666664', 'appreciate', '2026-04-19T07:17:00+08:00'),
  ('21000000-0000-4000-8000-000000000012', '66666666-6666-4666-8666-666666666662', 'appreciate', '2026-04-18T13:30:00+08:00'),
  ('21000000-0000-4000-8000-000000000004', '66666666-6666-4666-8666-666666666663', 'appreciate', '2025-08-31T10:00:00+08:00'),
  ('21000000-0000-4000-8000-000000000016', '66666666-6666-4666-8666-666666666661', 'appreciate', '2026-04-22T15:40:00+08:00'),
  ('21000000-0000-4000-8000-000000000016', '66666666-6666-4666-8666-666666666662', 'appreciate', '2026-04-22T15:42:00+08:00'),
  ('21000000-0000-4000-8000-000000000017', '66666666-6666-4666-8666-666666666663', 'appreciate', '2026-04-23T08:55:00+08:00'),
  ('21000000-0000-4000-8000-000000000017', '66666666-6666-4666-8666-666666666664', 'appreciate', '2026-04-23T08:56:00+08:00'),
  ('21000000-0000-4000-8000-000000000018', '66666666-6666-4666-8666-666666666661', 'appreciate', '2026-04-23T09:35:00+08:00'),
  ('21000000-0000-4000-8000-000000000019', '66666666-6666-4666-8666-666666666662', 'appreciate', '2026-04-23T09:50:00+08:00'),
  ('21000000-0000-4000-8000-000000000020', '66666666-6666-4666-8666-666666666663', 'appreciate', '2026-04-23T10:20:00+08:00');

COMMIT;

-- If you want local author login to work immediately, keep ADMIN_EMAIL aligned with:
--   you@example.com
--
-- Suggested pages to verify:
-- 1. /posts/monthly-note-2025-10-anxiety-creativity
--    - 4 newer + 4 older neighbors
--    - TOC + reading progress
--    - top-level comments + replies + likes + reactions
-- 2. /posts/dashboard-saas-notes-json
--    - content_json render path
-- 3. /posts/quiet-day-without-headings
--    - empty TOC case
-- 4. /timeline and /
--    - multiple seasons, categories, tags, latest comments rail
-- 5. /posts/editor-taxonomy-working-copy
--    - published article with a separate working copy in the editor
-- 6. /posts/image-rich-json-editor-test
--    - image node rendering and responsive article media
-- 7. /posts/many-tags-layout-stress
--    - long tag wrapping and header metadata layout
-- 8. /posts/archived-taxonomy-history
--    - archived category/tag display on historical posts
-- 9. /editor and /preview/*
--    - draft + scheduled + published author posts, including unpublished changes
-- 10. /account
--    - unread interaction notifications for likes, appreciations, comments, and replies
