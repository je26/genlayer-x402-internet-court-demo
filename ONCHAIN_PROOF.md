# Pay & Prove — on-chain proof (Studio Next, chain 61997)

## Contract
- **PayProveEscrow**: `0x072a9e7c549C81f64FBE96990eB122DCd85E18b0`
- **Deploy TX**: `0x99fce8c5569d616c1c4103462d5dc22db8ac43e07ea2aff25a131a23892d3228`
- **Explorer (contract)**: https://explorer-studio-dev.genlayer.com/address/0x072a9e7c549C81f64FBE96990eB122DCd85E18b0
- **Explorer (deploy tx)**: https://explorer-studio-dev.genlayer.com/tx/0x99fce8c5569d616c1c4103462d5dc22db8ac43e07ea2aff25a131a23892d3228
- **Consensus contract**: `0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575`
- **RPC**: https://studio-next.genlayer.com/api (also https://studio-dev.genlayer.com/api)
- **Deployer / buyer wallet**: `0x1789E592023c9229Ff966E8da7F17646d6A8bf33`
- **py-genlayer version (Depends)**: `1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` (the WizardOfCoin version — the Storage-template version `kzybg95x...` does NOT support TreeMap; contracts deployed with it finalize but are unreadable via gen_call)

## Verified deal lifecycle (all on-chain, read back via genlayer-js readContract)

### deal-001 — dispute -> Internet Court adjudication -> REFUND
- Item: "AI market-research report (10 pages, English)", amount 0.05 GEN
- Seller: `0x8ae56dde3606b369ea9ca8c5f25ff5735b225c8b`
- create_deal TX: `0xb88ec4dd42d9693027a9bb52884d0f855c73a23d8aad0fcd3fd95545b662d203` -> status `created`
- dispute TX: `0x7ca2ff2b428903b9feb91c40bff9a0052f5161f70cc058f65b30f46317523c6c` -> status `disputed`
  - Reason: "The seller never sent the report. No file, no link, no message after payment. Three days passed and nothing was delivered."
- adjudicate TX: `0xc1d473f463ac34ef90186ce1b4c04a657b9aec4dea9cfadfcda4e3933d3321ac` -> status `resolved_refund`, outcome `refund`
  - Verdict (LLM consensus): "The buyer provided clear evidence that the seller never sent the promised 10-page report or any delivery link after payment, with three days having passed. The funds should therefore be refunded to the buyer."

### deal-002 — happy path -> DELIVERED
- Item: "Logo design pack (3 concepts, SVG + PNG)", amount 0.03 GEN
- create_deal TX: `0xb421842bb225bf456b2dbeebc6b7070f84f96d2f847e36527dbdc2df6578a7c8` -> status `created`
- confirm_delivery TX: `0xd312e34fac1f94d8eec01a795fb60f92f8124813fa1cf8732a8cfb41dc7423fb` -> status `delivered`, outcome `release`

## How the adjudication works
`adjudicate(deal_id)` builds a prompt from the deal facts + dispute reason, calls
`gl.nondet.exec_prompt(prompt, response_format="json")` inside
`gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` — the leader proposes a verdict
(`{"release_funds": bool, "reply": str}`) and validators independently re-run the
same prompt and must agree on the boolean. The agreed verdict is stored on-chain
and sets the deal status to `resolved_release` or `resolved_refund`.

## Deploy method (proven)
- Build addTransaction calldata with genlayer-js SDK in Node
  (`~/workspace/genlayer-v2test/build_deploy_escrow.mjs` for deploys,
  `~/workspace/genlayer-v2test/build_call.mjs` for method calls).
- Sign + broadcast with the airdrop-agent vault wallet
  (`/tmp/genlayer_sign_broadcast.py`, `aa.vault.load_evm("id-ewd6o7-imp-1789e5")`).
- GenLayer node `eth_estimateGas` accepts ONLY 1 param — use
  `w3.manager.request_blocking("eth_estimateGas", [txobj])`, gas = estimate x 1.2,
  gasPrice 0, legacy tx WITHOUT a "type" field, chainId 61997.
- Method calls: `data = [encode(makeCalldataObject(fn, args, kwargs)), leaderOnly]`,
  `serialized = serialize(data)`, `recipient = <contract address>`.
