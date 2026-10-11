# PulseMascot Production Deployment & Launch Guide
## Enterprise Cloud Hosting & Shopify Partner Setup

This guide provides end-to-end instructions for deploying the PulseMascot backend to production cloud infrastructure and connecting it to your Shopify Partner account.

---

### Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │          Shopify Storefront             │
                      │  Liquid Theme App Extension (Embed)     │
                      │  Shadow DOM <store-mascot> (<35KB)      │
                      └────────────────────┬────────────────────┘
                                           │ Telemetry Beacon
                                           ▼
┌─────────────────────────┐     ┌─────────────────────────────────────────┐
│  Shopify Admin Polaris  │────▶│    PulseMascot Backend (Node.js)        │
│    App Bridge 4.0       │     │    • Zero NPM Dependencies              │
│  http://.../admin       │     │    • Frame-Ancestors CSP                │
└─────────────────────────┘     │    • GDPR HMAC Webhooks                 │
                                │    • Shopify Billing API                │
                                └────────────────────┬────────────────────┘
                                                     ▼
                                      Persistent Storage (/app/data)
                                      • analytics.json
                                      • settings.json
```

---

### Option 1: 1-Click Cloud Deployment via Render.com (Recommended)

1. **Push Code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: PulseMascot production asset release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pulse-mascot.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Log into [Render.com](https://render.com).
   - Click **New +** > **Blueprint**.
   - Connect your GitHub repository.
   - Render automatically reads [`render.yaml`](./render.yaml), provisions the Node web service, mounts the persistent 1GB disk at `/app/data`, and runs `node server.js`.

3. **Configure Environment Variables in Render**:
   - `SHOPIFY_API_KEY`: Client ID from Shopify Partner Dashboard.
   - `SHOPIFY_API_SECRET`: Client Secret from Shopify Partner Dashboard.
   - `SCOPES`: `""` (Zero sensitive scopes needed; fast-tracks review).
   - `NODE_ENV`: `production`.

---

### Option 2: 1-Click Deployment via Railway or Docker

1. **Deploy with Railway**:
   - Install Railway CLI or connect via [Railway.app](https://railway.app).
   - Railway reads [`railway.json`](./railway.json) & [`Dockerfile`](./Dockerfile) automatically.
   - Attach a persistent volume to `/app/data`.

2. **Deploy via Docker on Any Linux VPS / Cloud VM**:
   ```bash
   docker build -t pulse-mascot:latest .
   docker run -d \
     --name pulse-mascot \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     -e NODE_ENV=production \
     pulse-mascot:latest
   ```

---

### Step 3: Shopify Partner Dashboard Setup

1. Open your [Shopify Partner Dashboard](https://partners.shopify.com/) > **Apps** > **Create App**.
2. **App Configuration**:
   - **App Name**: `PulseMascot: Cart & AOV Boost`
   - **App URL**: `https://your-production-url.com/admin`
   - **Allowed redirection URL(s)**:
     - `https://your-production-url.com/auth/callback`
     - `https://your-production-url.com/admin`
3. **App Proxy Configuration**:
   - **Subpath prefix**: `apps`
   - **Subpath**: `pulse-mascot`
   - **Proxy URL**: `https://your-production-url.com/api`
4. **Mandatory Compliance Webhooks**:
   Under **App Setup** > **Compliance Webhooks**, enter:
   - **Customer data request**: `https://your-production-url.com/api/webhooks/customers/data_request`
   - **Customer data erasure**: `https://your-production-url.com/api/webhooks/customers/redact`
   - **Shop data erasure**: `https://your-production-url.com/api/webhooks/shop/redact`
   - **App uninstalled webhook**: `https://your-production-url.com/api/webhooks/app/uninstalled`
5. **Theme App Extension Push**:
   In your local terminal:
   ```bash
   shopify app deploy
   ```
   This compiles and uploads `extensions/store-mascot-ext` directly to Shopify's CDN.

---

### Step 4: Verification & Smoke Test Checklist

- [x] **CSP Frame-Ancestors**: Verified header allows `admin.shopify.com` and `*.myshopify.com`.
- [x] **Lighthouse Score**: Storefront preserves 100/100 Core Web Vitals (<35KB footprint).
- [x] **Theme Embed**: Toggles cleanly in Shopify Theme Editor without modifying theme code.
- [x] **A/B Split Test Engine**: Collects Variant A vs Variant B telemetry and computes conversion lift.
- [x] **GDPR HMAC Verification**: `X-Shopify-Hmac-Sha256` verified for data privacy compliance.
- [x] **Recurring Billing**: Integration endpoints for `Growth ($49/mo)` and `Pro ($99/mo)` plans.
