# Threadline

Threadline is a production-oriented SaaS application that compares a resume with a job description from a recruiter's perspective. Its core constraint is simple: every recommendation must be supported by evidence in the resume.

## Stack

- React 19, TypeScript, and Vite
- Netlify Functions
- Anthropic Claude with structured JSON output
- Stripe Checkout
- Netlify hosting

## Local development

Requirements: Node.js 20.19 or newer and the Netlify CLI.

1. Copy `.env.example` to `.env` and add your credentials.
2. Install dependencies with `npm install`.
3. Run `netlify dev` so the frontend and functions are available together.
4. Open the local URL printed by Netlify.

Running `npm run dev` starts Vite alone; calls to `/api/*` require the Netlify proxy.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | Authenticates Claude requests |
| `ANTHROPIC_MODEL` | No | Overrides the default Claude model |
| `STRIPE_SECRET_KEY` | Yes | Creates Checkout Sessions |
| `STRIPE_PRICE_ID` | Yes | Stripe Price for the Deep Dive report |
| `URL` | Netlify-managed | Canonical production origin used for redirects |

Create a one-time Stripe Price for the $19 Deep Dive product, then assign its ID to `STRIPE_PRICE_ID`.

## Deployment

1. Import the GitHub repository into Netlify.
2. Netlify reads the build, publish, redirect, header, and function settings from `netlify.toml`.
3. Add the required environment variables in Netlify.
4. Deploy and test one analysis and one Stripe test-mode purchase before enabling live payments.
5. Update `public/robots.txt` and `public/sitemap.xml` if the production domain differs from `threadline.app`.

## Data and truth safeguards

- Resume and job-description inputs are bounded and not written to an application database.
- The Claude system prompt forbids invented qualifications and treats missing evidence as a gap.
- Structured output is schema-constrained and validated again before it reaches the browser.
- Scores are explicitly framed as directional, not guarantees.
- Users are reminded to verify every generated recommendation.

## Production checklist

- Configure Anthropic and Stripe secrets in Netlify, never in client-side variables.
- Review the legal pages for the final operating entity and support contact.
- Add rate limiting or bot protection appropriate to expected traffic.
- Configure Stripe webhook-backed fulfillment before offering durable paid-report access across devices.
- Confirm Anthropic data-handling settings match the published privacy policy.

## Commands

```bash
npm install
npm run build
```
