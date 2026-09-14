# Trust Architecture — T3N Payroll Agent

This document walks through exactly how the payroll agent stays "trusted" end to end, mapped to what the Terminal 3 ADK actually does. It is written so a reviewer can verify every claim against the SDK behaviour.

## 1. The problem

A payroll agent must read the most sensitive data a company holds (employee bank accounts) and perform the most sensitive action (move money). Deploying one naively means:

- The agent process holds plaintext account numbers → any prompt injection, memory dump, or log leak is a full PII breach.
- The bank receives API calls from "a bot" with no accountable identity.
- When a transfer is wrong, there is no cryptographic proof of who authorized it.

## 2. The T3 ADK position in the flow

```
YOUR AGENT                T3 AGENT DEVELOPER KIT              DESTINATION
payroll-agent             Identity + Action Layer              Bank Payments
────────────────────────────────────────────────────────────────────────────
action            ──►     Ingest private data during runtime
bank.transfer($1,250)     Compute confidentially (TEE)
                          Verify results
                          0x4f…a12c · 23ms · Signed     ──►  did:t3n:organization
                                                               Account: ···· 4827
                                                               amount:  $1,250.00
```

Three phases, all owned by the ADK layer:

1. **Ingest private data during runtime** — the agent passes references (`ref://bank/acct/8412`), not values. The reference is dereferenced only inside the Trusted Execution Environment.
2. **Compute confidentially** — the TEE resolves the reference, validates the action against policy (amount limits, destination allow-lists), and executes.
3. **Verify + write audit** — the result is signed and an audit row is written to the T3 ledger before the action ever reaches the destination system. The signed receipt returned to the agent contains the masked account (`···· 4827`), so even the agent's own logs stay clean.

## 3. Identity model

- Signup at the T3N sandbox provisions a **W3C-compliant DID** (`did:t3n:…`) bound to the API key.
- `eth_get_address(API_KEY)` derives the signing address; `metamask_sign(address, undefined, API_KEY)` signs the login challenge.
- `client.handshake()` opens the encrypted TEE session; `client.authenticate(createEthAuthInput(address))` proves wallet → DID ownership.
- The DID can be resolved to an A2A card, ERC-8004 registry entry, or Entra Agent ID — one registration, every protocol.

## 4. What an auditor can verify after a run

For each `bank.transfer`:

- A signed ledger row binding: agent DID + destination DID + masked account + amount + timestamp + signature.
- That the raw account number never appears in any artifact outside the TEE (the agent process, its logs, and the repo all contain only references).
- Credit consumption per protected action via `client.getUsage()` — the sandbox economics meter exactly what the agent did.

## 5. Failure modes and how the design handles them

| Failure | Effect | Mitigation |
|---|---|---|
| Prompt injection on the payroll batch | Attacker tries to exfiltrate account numbers | Agent memory only ever holds references; numbers exist only inside the TEE per action |
| Compromised agent host | Attacker reads process memory | No secrets in code; API key injected per-run; raw account data never resident in the process |
| Disputed transfer | "Who ran this?" | Signed ledger row names the agent DID and the exact action parameters |
| Over-limit transfer | Fraud | TEE policy validation rejects before execution; the attempt itself is audited |

## 6. Sandbox economics

The T3N sandbox grants 20,000 test credits per signup — enough to register 25 agents and run ~5,000 protected actions. Each protected action in this demo consumes credits, verifiable with `getUsage()`, making the audit trail economically metered as well as cryptographically signed.
