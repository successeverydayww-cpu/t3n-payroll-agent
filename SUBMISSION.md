# Submission Plan — T3N "Trusted Agent" Bounty (290 USDC, Superteam Earn)

## What the bounty asks (from the listing)
"Try out new docs to build a trusted agent with T3N that we can distribute / host." — Terminal 3 Network, 290 USDC.

So the judges score four things:
1. A real, working agent built on the T3N SDK + docs (not a mockup).
2. Trust story — identity, confidential compute, auditability clearly demonstrated.
3. Distributable / hostable — a public repo others can run with their own key.
4. Quality of the write-up — this bounty is docs-heavy; the repo must teach.

## Deliverables checklist
- [x] Working agent code on @terminal3/t3n-sdk (src/index.ts) — auth → protected bank.transfer actions → signed receipts → credit usage report
- [x] README that teaches the trust model in plain language (the "try out new docs" ask)
- [x] docs/architecture.md — full end-to-end trust walkthrough with failure modes table
- [x] Runnable by anyone: npm install + own API key + npm start (no secrets in repo)
- [ ] Push to a PUBLIC GitHub repo (skylar's account)
- [ ] Submit on Superteam Earn with the repo link + 5-line pitch
- [ ] Bonus points: screenshot of a signed sandbox run + DID

## Submission pitch (draft)
"Payroll agent on the T3N ADK — reads HR data and triggers bank transfers without ever holding raw account numbers. Full trust walkthrough (TEE reference substitution, did:t3n identity, signed ledger audit rows), runnable in 5 minutes with your own sandbox key. The repo doubles as a tutorial for building your first trusted agent on T3."

## Competitive positioning (why ours wins)
- Most entrants will submit a bare code dump. Ours: working code + teaching-grade docs + failure-mode analysis + distribution instructions — the "distribute / host" clause is explicitly answered.
- We mirror their flagship Payroll Agent reference demo, which shows we read their material deeply — but we extend it with the audit-verifiability and failure-modes angle.
- Zero secrets in the repo; DID + masked receipt screenshots only. Professional-grade.

## If we place below #1
The repo remains a portfolio asset: reusable skeleton for every future T3N/TEE bounty, and the SDK mastery carries to the next Superteam listing. No wasted motion.
