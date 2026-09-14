/**
 * T3N Payroll Agent — a trusted agent built on the Terminal 3 Network Agent Developer Kit.
 *
 * Flow (mirrors the flagship T3 ADK "payroll-agent" reference demo):
 *   1. Load API key from environment (never hard-code it).
 *   2. Open an authenticated TEE session (client.handshake()).
 *   3. Prove ownership of our did:t3n identity (client.authenticate()).
 *   4. Ingest the payroll batch (private employee data) during runtime.
 *   5. Resolve sensitive references (bank account numbers) inside the TEE —
 *      the raw account number never leaves the enclave and is never printed.
 *   6. Execute the protected action "bank.transfer(amount)" — verified,
 *      signed, and written to the T3 ledger as an audit row.
 *   7. Report results + remaining sandbox credits.
 */

import {
  T3nClient,
  loadWasmComponent,
  setEnvironment,
  createEthAuthInput,
  eth_get_address,
  metamask_sign,
} from "@terminal3/t3n-sdk";

// --- Configuration ---------------------------------------------------------
setEnvironment(process.env.T3N_ENV === "production" ? "production" : "sandbox");

const API_KEY = process.env.T3N_API_KEY;
if (!API_KEY) {
  console.error("Missing T3N_API_KEY environment variable.");
  process.exit(1);
}

// A payroll batch from an HR system. In production this is fetched from the
// HRIS; raw bank details are referenced by ID, never carried inline.
interface Payee {
  employeeId: string;
  name: string;
  // Sensitive reference — resolved inside the TEE by the bank connector.
  bankAccountRef: string;
  amountUsd: number;
}

const PAYROLL_BATCH: Payee[] = [
  { employeeId: "EMP-1001", name: "A. Okafor",   bankAccountRef: "ref://bank/acct/8412", amountUsd: 1250 },
  { employeeId: "EMP-1002", name: "B. Silva",    bankAccountRef: "ref://bank/acct/9277", amountUsd: 1840 },
  { employeeId: "EMP-1003", name: "C. Mensah",   bankAccountRef: "ref://bank/acct/1533", amountUsd: 960 },
];

// --- Trusted agent setup ---------------------------------------------------
const address = eth_get_address(API_KEY);

const client = new T3nClient({
  // all crypto runs inside WASM
  wasmComponent: await loadWasmComponent(),
  // signs the login challenge
  handlers: { EthSign: metamask_sign(address, undefined, API_KEY) },
});

// Open an encrypted session in the TEE.
await client.handshake();

// Prove: our wallet -> our did:t3n:…
await client.authenticate(createEthAuthInput(address));

// --- Protected action: run payroll -----------------------------------------
async function runPayroll(batch: Payee[]) {
  const results: { employeeId: string; status: string }[] = [];

  for (const payee of batch) {
    // The T3 ADK wraps the outbound action: it verifies our identity,
    // substitutes the sensitive reference inside the TEE, and writes an
    // audit row to the ledger before the action reaches the bank system.
    const action = client.protect("bank.transfer", {
      reference: payee.bankAccountRef,
      amount: payee.amountUsd,
      currency: "USD",
      memo: `Payroll ${payee.employeeId}`,
      // verifiable agent identity resolved to did:t3n:…
    });

    const receipt = await action.execute();
    results.push({ employeeId: payee.employeeId, status: receipt.signed ? "Signed" : "Failed" });
    // NOTE: the raw account number never appears in logs or output —
    // only the masked reference and the signed receipt.
  }
  return results;
}

const isDemo = process.argv.includes("--demo");
const results = await runPayroll(PAYROLL_BATCH.slice(0, isDemo ? 1 : undefined));

console.log("Payroll run complete:");
for (const r of results) console.log(`  ${r.employeeId}: ${r.status}`);

// Our sandbox token balance — proves the agent consumes credits per action.
const { balance } = await client.getUsage();
console.log(`Credits available: ${balance.available}`);
