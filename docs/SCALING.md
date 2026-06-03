# Noori Wala — Play Store + Scale-to-2B Operations Guide

This document is the single playbook for taking Noori Wala from preview to
Google Play and operating it at internet scale (1–2B users). Read it
end-to-end before publishing. Everything here is the **builder's**
responsibility — Lovable Cloud handles the database, but DNS, app-store
listings, SMS providers, CDNs and cost limits are yours to configure.

---

## 1. Pre-publish checklist (must do)

### Backend / security
- [ ] **Email sender domain** verified in *Cloud → Emails → Manage Domains*. Until DNS is green, Gmail 2FA codes will not be delivered.
- [ ] **SMS provider** configured in *Cloud → Users → Auth Settings → Phone provider* (Twilio recommended). Without this, phone OTP fails silently.
- [ ] In Twilio: enable **SMS Pumping Protection** and lock **SMS Geo Permissions** to your target countries — otherwise attackers can drain your balance overnight.
- [ ] **Leaked-password protection** ON: *Cloud → Users → Auth Settings → Email → Password HIBP Check*.
- [ ] **Captcha** ON for phone & email signup: Supabase Auth → Bot Protection → hCaptcha or Turnstile.
- [ ] Re-run **Security Linter** until clean (or each warning documented in `mem://security`).
- [ ] All edge functions deployed; no `console.log` of OTP codes in production logs.

### Android app (Capacitor)
- [ ] `appId = com.nooriwala.app` and `appName = "Noori Wala"` in `capacitor.config.ts`.
- [ ] Bump `versionCode` and `versionName` in `android/app/build.gradle`.
- [ ] Generate a **release keystore** and store it in 1Password / Vault — losing it means you can never update the app.
- [ ] Build signed `.aab`: `cd android && ./gradlew bundleRelease`.
- [ ] Test the release build on at least one mid-range device + one Android 8 device.
- [ ] Privacy Policy URL live at `/privacy` and reachable without auth.
- [ ] Terms of Service URL live at `/terms`.
- [ ] Data-safety form completed truthfully (phone number, email, IP, message content stored).
- [ ] Target API level meets Google's current requirement (currently 34+).

### App content / store listing
- [ ] App icon 512×512 (already present at `src/assets/app-icon.png`).
- [ ] Feature graphic 1024×500.
- [ ] At least 4 phone screenshots (1080×1920 or higher).
- [ ] Short description (≤ 80 chars), full description (≤ 4000 chars).
- [ ] Category: **Communication**.
- [ ] Content rating questionnaire completed (likely "Teen" — user-generated chat).
- [ ] Account-deletion flow available in-app **and** as a web URL (Google now requires both).

### Compliance
- [ ] If you store EU user data: publish a **GDPR DPA** and offer data export/delete in Settings → Account.
- [ ] If you target India: a separate **Grievance Officer** contact must be listed.
- [ ] Add an in-app "Report" + "Block" path (already present) and document the response SLA.

---

## 2. Architecture to scale toward 1–2B users

Lovable Cloud (Postgres + Edge Functions + Storage) is enough for the first
few million MAU. Beyond that, you grow by **moving hot paths off Postgres**,
**moving media off the origin**, and **moving real-time off the request loop**.

```
                ┌────────────────────────────────────────┐
   Apps  ─────▶│  Cloudflare (WAF + bot mgmt + cache)   │─────▶ Static site
                └──────────────┬────────────┬────────────┘
                               │            │
                               ▼            ▼
                         ┌─────────┐   ┌──────────────────────┐
                         │ Edge fn │   │ Realtime / WebSocket │
                         │ (auth,  │   │ fanout (sharded)     │
                         │  REST)  │   └──────────────────────┘
                         └────┬────┘
                              │
            ┌─────────────────┼──────────────────────────┐
            ▼                 ▼                          ▼
     ┌────────────┐    ┌────────────┐            ┌────────────────┐
     │ Postgres   │    │ Redis /    │            │ Object storage │
     │ (sharded   │    │ KV (rate   │            │ + CDN (R2 / S3 │
     │  by user)  │    │ limit,     │            │ + CloudFront)  │
     │            │    │ presence,  │            └────────────────┘
     │ read       │    │ inbox      │
     │ replicas   │    │ fanout)    │
     └────────────┘    └────────────┘
                              ▲
                              │
                       ┌─────────────┐
                       │ Async queue │ (BullMQ / SQS) – push,
                       │             │ media transcode, search index
                       └─────────────┘
```

### 2.1 Database
- **Vertical first**: Lovable Cloud can be sized up to large Postgres instances. Do this before sharding — it buys you 10–50M users on most workloads.
- **Read replicas** for `messages`, `conversations`, `profiles`. Route the chat list, search, and contact lookup to replicas.
- **Sharding strategy (post-100M users)**: shard by `user_id` (or `conversation_id` for groups). Use a directory service (`shard_map(user_id) → shard_id`) so the app stays shard-agnostic.
- **Hot tables** (`messages`, `typing_indicators`, `presence`):
  - Move `typing_indicators` and presence to **Redis** — they don't need durability.
  - Partition `messages` by month. After 90 days, move to cold storage (S3 + Parquet) and serve from an "archive" endpoint.
- **Indexes**: every query in the app must hit an index. Add `EXPLAIN ANALYZE` to your CI for new queries.
- **Connection pooler**: PgBouncer in **transaction mode** in front of every Postgres instance. Edge functions exhaust connections fast.

### 2.2 Real-time / messaging
- Lovable Cloud's `postgres_changes` is great up to ~100k concurrent. Past that:
  - Move fanout to a dedicated **WebSocket cluster** (Centrifugo, Ably, or your own with Phoenix Channels / NATS).
  - The DB only stores messages; the WS layer fans out to recipients' devices.
  - Use **per-user inbox queues** in Redis Streams to absorb spikes.
- For mobile push: integrate **Firebase Cloud Messaging (Android)** + **APNs (iOS)** via a small edge function that listens for new messages and dispatches push. Lovable Cloud doesn't ship native FCM — add this once you publish.

### 2.3 Media (photos, video, scanned PDFs)
- Store the raw upload in object storage (today: Lovable Cloud Storage). For 2B scale, mirror to **Cloudflare R2** or **S3** and front it with **CloudFront / Cloudflare CDN**.
- Generate thumbnails in an async worker (BullMQ / SQS) — never inline in the upload request.
- Strip EXIF on upload.
- Set object lifecycle: thumbnails kept forever, originals to **Glacier / R2 archive** after 90 days.

### 2.4 Caching & edge
- Put **Cloudflare** in front of `nooriwala.com` and `/app`. Enable:
  - **WAF managed rules** (OWASP).
  - **Bot Fight Mode** + **Turnstile** challenges for `/auth/*` and `/api/*`.
  - Rate-limit rules: 5 OTP requests / 10 min / IP, 60 logins / hour / IP.
  - **Cache rules** for static assets only — never cache authenticated API responses.

### 2.5 Rate limiting & abuse
- OTP: server-side throttling already exists in `send-2fa-otp`. Mirror it for phone OTP via Cloudflare WAF (Supabase phone OTP isn't ours to throttle directly).
- Message send: cap at e.g. **30 messages/sec/user** via Redis token bucket in an edge function wrapper.
- Account creation: require captcha + verified phone.
- Add **shadow-banning** for spammers (writes succeed for them, but no one else sees the message) — better UX than hard blocks.

### 2.6 Observability
- Ship logs to **Logflare / Datadog / Grafana Cloud**.
- Alert on: 5xx > 1% over 5 min, OTP delivery failure rate > 5%, queue lag > 30s, DB replication lag > 10s.
- **Synthetic checks** every 60s for: login, send message, fetch chat list.

### 2.7 Cost model (back-of-envelope, USD, monthly, at scale)
| Users (MAU) | DB | Realtime | Storage + CDN | SMS OTP | Total |
|---:|---:|---:|---:|---:|---:|
| 1M | $2k | $1k | $3k | $5k | **~$11k** |
| 50M | $40k | $25k | $80k | $150k | **~$300k** |
| 500M | $300k | $200k | $700k | $1M | **~$2.2M** |
| 2B | $1M+ | $800k | $3M | $4M+ | **~$9M+** |

SMS dominates. At 50M+ MAU you must move signup to **passkeys / email magic links / Google One-Tap** and keep SMS as fallback.

---

## 3. Operational runbook

| Symptom | First check | Fix |
|---|---|---|
| OTP not arriving | *Security Center* → "Phone OTP delivery failed" rows; Twilio console | Bad SMS Geo Permissions or out-of-balance |
| 2FA emails not arriving | *Cloud → Emails* status | DNS not green; or recipient marked as bounced |
| App slow worldwide | Cloudflare analytics, p95 latency | Origin overloaded — scale DB / add replica |
| Real-time messages stuck | `pg_stat_replication`, WS metrics | Replication lag → failover or restart WS pod |
| Spam wave | `security_events` table volume | Tighten Cloudflare WAF rule + temp captcha on signup |
| Storage costs spiking | Bucket usage report | Tighten lifecycle policy, force re-encode large videos |

---

## 4. Release flow

1. Test in preview → publish to `nooriwala.lovable.app`.
2. Smoke-test on real Android device (Chrome + installed PWA + Capacitor build).
3. Tag a release: `git tag v1.x.y && git push --tags`.
4. Build signed `.aab` and upload to **Google Play Console → Internal testing** track.
5. Promote Internal → Closed (alpha) → Open (beta) → Production with 7-day gaps.
6. Monitor Play Console **Vitals** for ANRs and crashes for the first 72h after each rollout.

---

Keep this file under version control. Update it whenever architecture or
limits change — it is the source of truth for ops.
