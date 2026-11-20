# Pay & Prove — x402 × Internet Court × GenLayer

**An agent pays. The court decides.**

An AI buyer pays an AI seller through an **x402-style payment**. The funds sit in a
**GenLayer intelligent escrow**. If the seller does not deliver, the buyer disputes — and
the **Internet Court** (GenLayer LLM consensus) adjudicates on-chain and renders a
verdict: **release** or **refund**. No human judge. No chargeback department. Just a
verdict.

Built for the GenLayer **“Internet Court: Partner Demo Lab”** (Mission 101).
Partner: **x402** — the payment protocol (Internet Court stack, layer 4).

---

## What is proven on-chain (not a mock)

A real `PayProveEscrow` intelligent contract is **live on GenLayer Studio Next
(chain 61997)** and two deals ran end-to-end through it. Every transaction below is
public and linked.

| | |
|---|---|
| **Contract** | [`0x072a9e7c549C81f64FBE96990eB122DCd85E18b0`](https://explorer-studio-dev.genlayer.com/address/0x072a9e7c549C81f64FBE96990eB122DCd85E18b0) |
| **Deploy tx** | [`0x99fce8c5…`](https://explorer-studio-dev.genlayer.com/tx/0x99fce8c5569d616c1c4103462d5dc22db8ac43e07ea2aff25a131a23892d3228) (FINALIZED) |
| **Chain** | GenLayer Studio Next · 61997 · RPC `https://studio-next.genlayer.com/api` |
| **Consensus** | `0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575` |

### deal-001 — disputed → REFUNDED (the court worked)

| Step | Tx | Result |
|---|---|---|
| create_deal — “AI market-research report (10 pages)”, 0.05 GEN | [`0xb88ec4dd…`](https://explorer-studio-dev.genlayer.com/tx/0xb88ec4dd42d9693027a9bb52884d0f855c73a23d8aad0fcd3fd95545b662d203) | `created` |
| dispute — “The seller never sent the report. No file, no link, no message after payment. Three days passed and nothing was delivered.” | [`0x7ca2ff2b…`](https://explorer-studio-dev.genlayer.com/tx/0x7ca2ff2b428903b9feb91c40bff9a0052f5161f70cc058f65b30f46317523c6c) | `disputed` |
| adjudicate — LLM consensus verdict | [`0xc1d473f4…`](https://explorer-studio-dev.genlayer.com/tx/0xc1d473f463ac34ef90186ce1b4c04a657b9aec4dea9cfadfcda4e3933d3321ac) | `resolved_refund` |

> **Internet Court verdict (on-chain):** “The buyer provided clear evidence that the
> seller never sent the promised 10-page report or any delivery link after payment,
> with three days having passed. The funds should therefore be refunded to the buyer.”

### deal-002 — happy path → DELIVERED

| Step | Tx | Result |
|---|---|---|
| create_deal — “Logo design pack (3 concepts, SVG + PNG)”, 0.03 GEN | [`0xb421842b…`](https://explorer-studio-dev.genlayer.com/tx/0xb421842bb225bf456b2dbeebc6b7070f84f96d2f847e36527dbdc2df6578a7c8) | `created` |
| confirm_delivery | [`0xd312e34f…`](https://explorer-studio-dev.genlayer.com/tx/0xd312e34fac1f94d8eec01a795fb60f92f8124813fa1cf8732a8cfb41dc7423fb) | `delivered` · outcome `release` |

Full proof (tx hashes, read-back output, method notes): [`ONCHAIN_PROOF.md`](ONCHAIN_PROOF.md).

---

## How it works

```
buyer agent ──402 Payment Required──► seller agent
     │  pays 0.05 GEN
     ▼
 PayProveEscrow (GenLayer intelligent contract)
     │  funds locked · deal facts stored
     ├─ confirm_delivery() ──► delivered → funds released
     └─ dispute(reason) ──► adjudicate()
                              └─ gl.vm.run_nondet_unsafe(leader, validators)
                                 leader proposes a verdict via gl.nondet.exec_prompt
                                 validators independently re-judge
                                 agreed verdict executes → release | refund
```

The adjudication is the GenLayer-native pattern (same shape as the portal's own
WizardOfCoin contract): a leader LLM proposes `{"release_funds": true/false,
"reply": "…"}` and validator LLMs must agree before the verdict is written on-chain.
The contract never trusts a single model call.

### The x402 part

x402 is the HTTP `402 Payment Required` protocol: a seller answers a request with a
payment demand (price + asset + destination), the buyer pays, and the seller serves.
Here the “destination” is the escrow contract, not the seller's pocket — so the
payment is **conditional**: the seller only gets paid if it delivers (or the court
says it did). That is the whole point of pairing x402 with the Internet Court:
payments become disputable, and disputes become machine-judgable.

---

## Repo layout

```
contract/PayProveEscrow.py     the intelligent contract (py-genlayer)
frontend/index.html            single-page demo — live deal view + verdicts
frontend/assets/               GenLayer / x402 / Internet Court logos
scripts/build_deploy_escrow.mjs  build a deploy addTransaction (genlayer-js)
scripts/build_call.mjs           build a method-call addTransaction
scripts/sign_broadcast.py        sign + broadcast with a local wallet
scripts/verify_escrow.mjs        read a deal back from the contract
video/remotion/                  Remotion source for the 42 s demo video
SUBMISSION.md                    ready-to-paste portal submission text
ONCHAIN_PROOF.md               full on-chain proof
```

> The rendered demo video (`video/pay-and-prove-demo.mp4`, 42 s, 9:16) is
> distributed as a YouTube Short (the evidence link for the submission). The
> Remotion source that builds it is in `video/remotion/`.

---

## Reproduce it

### 1. Read a deal (no wallet needed)

```bash
cd scripts
npm install
node verify_escrow.mjs                                  # deal-001
node verify_escrow.mjs 0x072a9e7c549C81f64FBE96990eB122DCd85E18b0 deal-002
```

### 2. Open the demo page

Open `frontend/index.html` in a browser (or serve this folder). It re-reads both
deals live from Studio Next and falls back to the verified on-chain snapshot if the
RPC is unreachable.

### 3. Deploy your own copy (needs a wallet with test GEN on Studio Next)

```bash
cd scripts
npm install
# SENDER in build_deploy_escrow.mjs must be your address; fund it from the
# Studio Next faucet, then:
node build_deploy_escrow.mjs > /tmp/deploy_tx.json
python3 sign_broadcast.py /tmp/deploy_tx.json
```

### 4. Drive a deal

```bash
node build_call.mjs <CONTRACT> create_deal '["deal-001","<SELLER>","AI market-research report (10 pages, English)","0.05"]' 0.05 > /tmp/call_tx.json
python3 sign_broadcast.py /tmp/call_tx.json
# then: dispute, adjudicate, confirm_delivery — same pattern
node build_call.mjs <CONTRACT> dispute '["deal-001","The seller never sent the report."]'
node build_call.mjs <CONTRACT> adjudicate '["deal-001"]'
node build_call.mjs <CONTRACT> confirm_delivery '["deal-002"]'
```

### Gotchas (learned the hard way)

- **The GenLayer node rejects 2-param `eth_estimateGas`.** `web3.py` and `viem` both
  send 2 params and fail. `sign_broadcast.py` uses a 1-param call:
  `w3.manager.request_blocking("eth_estimateGas", [txobj])`. Gas price is 0 on this
  testnet; send a **legacy tx with no `type` field**.
- **The py-genlayer version in the contract header matters.** The header
  `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`
  is the version that supports `TreeMap` and the `from genlayer import *` +
  `gl.Contract` pattern. The Storage-template version
  (`kzybg95x1gn21dw72m7hyg0maaap04n4nx55j9yt6fkdqxtz6bz0`) deploys but the contract
  is unreadable afterwards (“Contract not found” on `gen_call`).
- **Transactions go to the consensus contract** (`0xb7278A61…`), not directly to the
  intelligent contract. `build_call.mjs` / `build_deploy_escrow.mjs` build the
  `addTransaction` calldata with genlayer-js; `sign_broadcast.py` signs and sends it.

---

## Demo video

42 s, vertical 9:16 (YouTube Short). Built with Remotion — motion graphics
plus the real on-chain data (contract address, deal facts, verdict text, tx
hash). Shows the GenLayer, Internet Court and x402 logos. Source:
`video/remotion/`; render with `npx remotion render src/index.ts PayProve
../pay-and-prove-demo.mp4 --concurrency=1`.

## Testnet only

Everything here runs on GenLayer Studio Next testnet with test GEN. No real funds.
The demo wallet is `0x1789E592023c9229Ff966E8da7F17646d6A8bf33`.

## Links

- GenLayer — https://genlayer.com
- Internet Court — https://genlayer.com/blog/internet-court-for-ai-agents-is-in-session/
- x402 — https://www.x402.org · https://github.com/coinbase/x402
- GenLayer docs — https://docs.genlayer.com
- Explorer (Studio Next) — https://explorer-studio-dev.genlayer.com

## License

MIT
