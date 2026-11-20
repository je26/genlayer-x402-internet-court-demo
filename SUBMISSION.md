# Demo Lab submission (Mission 101) — ready-to-paste text

## Title
Pay & Prove — x402 payments escrowed in GenLayer, judged by the Internet Court

## Description
Pay & Prove pairs x402 with the Internet Court to make agent-to-agent payments
disputable — and disputes machine-judgable.

An AI buyer pays an AI seller through an x402-style payment (HTTP 402 Payment
Required). The funds do not go to the seller's pocket: they lock in a GenLayer
intelligent escrow, PayProveEscrow, on Studio Next. If the seller delivers, the
buyer confirms and the escrow releases. If the seller vanishes, the buyer
disputes — and the contract runs GenLayer LLM consensus to adjudicate: a leader
proposes a verdict, validators independently re-judge, and the agreed verdict
executes on-chain (release or refund).

This is not a mock. A real contract is live and two deals ran end-to-end through
it:
- deal-001: buyer paid 0.05 GEN for a market-research report, seller never
  delivered, buyer disputed, the Internet Court adjudicated on-chain and
  REFUNDED the buyer. Verdict text is on-chain.
- deal-002: happy path — buyer confirmed delivery, escrow released.

Contract: 0x072a9e7c549C81f64FBE96990eB122DCd85E18b0 (GenLayer Studio Next, 61997).
Deploy tx: 0x99fce8c5569d616c1c4103462d5dc22db8ac43e07ea2aff25a131a23892d3228.
Explorer: https://explorer-studio-dev.genlayer.com/address/0x072a9e7c549C81f64FBE96990eB122DCd85E18b0

The repo contains the contract source, a single-page demo that re-reads both
deals live from Studio Next, the scripts to deploy and drive a deal yourself
(including the 1-param eth_estimateGas workaround the GenLayer node requires),
a SKILL.md, and the full on-chain proof with every transaction hash.

## Evidence
1. GitHub repo (public): https://github.com/je26/genlayer-x402-internet-court-demo
2. Demo video (YouTube Short): [Jeje uploads pay-and-prove-demo.mp4 and pastes the Short URL here]
3. Live contract: https://explorer-studio-dev.genlayer.com/address/0x072a9e7c549C81f64FBE96990eB122DCd85E18b0
4. On-chain proof: ONCHAIN_PROOF.md in the repo

## How to submit (for Jeje, from his phone)
1. Upload video/pay-and-prove-demo.mp4 to YouTube as a Short (vertical 9:16).
2. Create the public GitHub repo (see blocker note below) — or confirm the repo URL above is live.
3. Open portal.genlayer.foundation → Missions → "Internet Court: Partner Demo Lab" (Mission 101) → Submit.
4. Paste the title + description above. Evidence: the GitHub repo URL + the YouTube Short URL.
5. Complete the reCAPTCHA and submit. Do NOT submit a duplicate of the Special Quest (Mission 103, already submitted).

## Blocker note (repo creation)
The Muse GitHub App connected to je26 cannot create new repositories (API returns
403 "Resource not accessible by integration"). Jeje must create the empty public
repo `genlayer-x402-internet-court-demo` on github.com himself (or from his phone),
then Beki pushes the files. All files are ready in ~/workspace/genlayer-demolab/.
