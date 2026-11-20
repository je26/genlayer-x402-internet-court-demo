# SKILL: Pay & Prove — x402 payment, GenLayer escrow, Internet Court verdict

Use this skill to reproduce the **Pay & Prove** demo: an agent-to-agent purchase
paid via an x402-style payment, held in a GenLayer intelligent escrow, and
adjudicated by the Internet Court (GenLayer LLM consensus) when the buyer disputes.

## What you need

- Node.js 18+ and Python 3.10+
- A wallet with test GEN on **GenLayer Studio Next (chain 61997)**.
  RPC: `https://studio-next.genlayer.com/api`
  Faucet: Studio Next “Get test GEN” (the Studio IDE faucet).
- This repo. `cd scripts && npm install` once.

## The live deployment (already running — read it, no wallet needed)

- Contract: `0x072a9e7c549C81f64FBE96990eB122DCd85E18b0`
- Explorer: https://explorer-studio-dev.genlayer.com/address/0x072a9e7c549C81f64FBE96990eB122DCd85E18b0
- deal-001 → `resolved_refund` (disputed, court refunded the buyer)
- deal-002 → `delivered` (happy path, funds released)

```bash
cd scripts
node verify_escrow.mjs            # deal-001
node verify_escrow.mjs 0x072a9e7c549C81f64FBE96990eB122DCd85E18b0 deal-002
```

## Run your own deal (needs a funded wallet)

### 1. Deploy a fresh escrow

Edit `scripts/build_deploy_escrow.mjs`: set `SENDER` to your address.

```bash
node build_deploy_escrow.mjs > /tmp/deploy_tx.json
python3 sign_broadcast.py /tmp/deploy_tx.json   # prints the tx hash
# wait for FINALIZED on the explorer, note the new contract address
```

### 2. Create a deal (buyer pays into escrow)

```bash
node build_call.mjs <CONTRACT> create_deal \
  '["deal-001","<SELLER_ADDRESS>","AI market-research report (10 pages, English)","0.05"]' 0.05 \
  > /tmp/call_tx.json
python3 sign_broadcast.py /tmp/call_tx.json
```

The last argument (`0.05`) is the escrow amount in GEN — it is sent as `value` with
the transaction. `create_deal(deal_id, seller, item, amount)`.

### 3. Dispute (buyer) — then adjudicate (anyone)

```bash
node build_call.mjs <CONTRACT> dispute \
  '["deal-001","The seller never sent the report. No file, no link, no message after payment. Three days passed and nothing was delivered."]' \
  > /tmp/tx.json && python3 sign_broadcast.py /tmp/tx.json

node build_call.mjs <CONTRACT> adjudicate '["deal-001"]' \
  > /tmp/tx.json && python3 sign_broadcast.py /tmp/tx.json
```

`adjudicate` runs LLM consensus on-chain: a leader proposes a verdict
(`release_funds` true/false + a one-or-two-sentence `reply`), validators re-judge,
and the agreed verdict is written to the deal. Takes a minute or two — the
consensus needs several blocks.

### 4. Happy path (seller delivers)

```bash
node build_call.mjs <CONTRACT> confirm_delivery '["deal-002"]' \
  > /tmp/tx.json && python3 sign_broadcast.py /tmp/tx.json
```

### 5. Read the result

```bash
node verify_escrow.mjs <CONTRACT> deal-001
# get_status → "resolved_refund" | "delivered" | "disputed" | "created"
# get_deal   → full deal JSON including the on-chain verdict text
```

Or open `frontend/index.html` — it reads the live contract and shows both deals.

## Contract API

| Function | Args | What it does |
|---|---|---|
| `create_deal` | `deal_id, seller, item, amount` | Opens a deal; escrow amount is the tx `value` |
| `confirm_delivery` | `deal_id` | Buyer confirms → `delivered`, outcome `release` |
| `dispute` | `deal_id, reason` | Buyer disputes → `disputed` |
| `adjudicate` | `deal_id` | LLM consensus → `resolved_release` or `resolved_refund` |
| `get_deal` | `deal_id` | Full deal JSON (buyer, seller, item, amount, status, dispute_reason, verdict, outcome) |
| `get_status` | `deal_id` | Status string |
| `get_name` | — | `"PayProveEscrow"` |

Deal statuses: `created` → `disputed` → `resolved_release` | `resolved_refund`;
`created` → `delivered`. Outcomes: `release` | `refund` | `""` (undecided).

## How the adjudication works (the GenLayer part)

`adjudicate` calls `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`:

- **Leader** (`leader_fn`): builds a prompt with the deal facts + dispute reason and
  calls `gl.nondet.exec_prompt`. It must answer JSON only:
  `{"release_funds": true/false, "reply": "one or two sentences"}`.
- **Validators** (`validator_fn`): each validator independently re-runs the same
  prompt and checks the leader's answer matches its own judgement.
- The consensus writes the agreed verdict into the deal. The contract never trusts
  a single model call — that is what makes it an *intelligent contract* rather than
  an API call in a wrapper.

The judge prompt is in `contract/PayProveEscrow.py` (`STYLE` + `FORMAT`). It is
deliberately conservative: vague disputes lean toward release; concrete evidence
of non-delivery leans toward refund.

## Signing — the GenLayer node quirk

The GenLayer node **rejects 2-param `eth_estimateGas`** (web3.py and viem both send
2 params and fail with `{"code":-32602,"message":"Too many parameters provided"}`).
`scripts/sign_broadcast.py` works around it:

- 1-param estimate: `w3.manager.request_blocking("eth_estimateGas", [txobj])`
- gas limit = estimate × 1.2, gasPrice = 0 (testnet), legacy tx, **no `type` field**
- transactions go to the **consensus contract**
  `0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575` as `addTransaction` calls built by
  `build_call.mjs` / `build_deploy_escrow.mjs` with genlayer-js.

`sign_broadcast.py` reads the tx JSON (`{"to","data","value"}`), signs with the
wallet configured in the script, and prints the tx hash. Set `VAULT_LABEL` (or
adapt the signer) to your own wallet — never paste a private key into the repo.

## Contract header — py-genlayer version

The contract pins:

```
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
```

That version supports `TreeMap` and the `from genlayer import *` + `gl.Contract`
pattern. The Storage-template version (`kzybg95x…`) deploys but the contract is
unreadable afterwards (“Contract not found” on `gen_call`). Do not change the pin.

## Troubleshooting

- **`eth_estimateGas` “Too many parameters provided”** — you are calling it with
  2 params. Use the 1-param form in `sign_broadcast.py`.
- **Contract deploys but `get_deal` returns “Contract not found”** — wrong
  py-genlayer version in the header. Use the pinned version above.
- **`adjudicate` takes minutes** — normal; consensus needs several blocks and
  multiple LLM calls. Wait for FINALIZED, then `verify_escrow.mjs`.
- **Portal does not show the deployment** — the portal's deployment-status API
  returns 503 `network_unavailable` for Studio Next; the explorer + `readContract`
  are the source of truth.
