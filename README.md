# T3N Payroll Agent

A trusted payroll agent built with the **Terminal 3 Network (T3N) Agent Developer Kit**. It reads HR data and triggers bank transfers **without ever holding raw account numbers** — every outbound action is wrapped by the T3 ADK: identity verified, sensitive references substituted inside a TEE, and an audit row written to the T3 ledger before the action reaches the destination system.

Built for the T3 ADK community challenge (Super AI Week 2026), using the T3N sandbox (20,000 test credits).

## Why this demonstrates "trusted agents"

AI agents that act on sensitive data have three unsolved problems:

1. **Identity** — how does the bank know the *agent* (not a human) calling it is legitimate?
2. **Data exposure** — a payroll agent that reads raw account numbers becomes a walking data breach.
3. **Auditability** — when an autonomous action fails, who signed off on it?

The T3 ADK answers all three:

| Problem | T3 mechanism | In this demo |
|---|---|---|
| Identity | W3C-compliant `did:t3n` signed with our API key | `client.authenticate(...)` proves our DID before any action |
| Data exposure | Sensitive references resolved inside the TEE | Payees carry `ref://bank/acct/…` — raw numbers never enter agent memory or logs |
| Auditability | Every protected action writes a signed ledger row | Each `bank.transfer` returns a signed receipt with the masked reference |

## Quick start

```bash
npm install

# Get your API key + DID from the T3N sandbox signup (terminal3.io → Agent Developer Kit)
export T3N_API_KEY=0x…            # your 64-hex API key
export T3N_ENV=sandbox            # or "production"

# Run the full payroll batch
npm start

# Or a single-transfer smoke test
npm run demo
```

Expected output:

```
Payroll run complete:
  EMP-1001: Signed
  EMP-1002: Signed
  EMP-1003: Signed
Credits available: 19994
```

## How it works

1. **Authenticate** — the agent loads its API key from the environment, opens an encrypted TEE session (`handshake()`), and proves ownership of its `did:t3n` identity (`authenticate(createEthAuthInput(address))`).
2. **Ingest private data at runtime** — the payroll batch (employee IDs, masked bank references, amounts) is only touched inside the session. Nothing sensitive is persisted.
3. **Execute protected actions** — `client.protect("bank.transfer", { reference, amount, … })` wraps the outbound call: the TEE resolves `ref://bank/acct/…` to the real account number, executes the transfer, and writes the signed audit row to the ledger.
4. **Report** — results and remaining sandbox credits (`getUsage()`) are printed. Raw account numbers never appear anywhere.

## Project structure

```
t3n-payroll-agent/
├── src/
│   └── index.ts        # The agent: auth → protected payroll actions → report
├── docs/
│   └── architecture.md # End-to-end trust architecture walkthrough
├── package.json
└── README.md
```

## Distributing / hosting this agent

- The agent is a plain Node.js process: host it on any serverless or container platform (Fly.io, Railway, AWS Lambda, Cloud Run).
- Distribute via `npm i t3n-payroll-agent` — consumers bring **their own** API key and DID; the agent code never contains secrets.
- One signup = 25 agent identities on the sandbox allocation, so each deployed instance can hold its own verifiable `did:t3n`.

## Extending

- Swap the static batch for a live HRIS connector (BambooHR, Workday).
- Add approval gating: an action proposal published to the ledger, executed only after a human co-signs — the T3 audit row then records both signatures.
- Register the agent's DID as an Entra Agent ID / A2A card for enterprise federation.

## License

MIT
