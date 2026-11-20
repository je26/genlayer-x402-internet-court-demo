"""Sign + broadcast a GenLayer tx with the airdrop-agent vault wallet.
Reads /tmp/genlayer_tx.json ({"to","data","value"}), uses 1-param eth_estimateGas
(the GenLayer node rejects 2-param), legacy tx WITHOUT a "type" field, gasPrice 0.
Key never leaves the vault: aa.vault.load_evm signs internally.
Usage: AIRDROP_HOME=~/.airdrop-agent python3 /tmp/genlayer_sign_broadcast.py [txfile] [outfile]"""
import json, sys, os
sys.path.insert(0, os.path.expanduser("~/workspace/research/airdrop-agent"))
from web3 import Web3
import aa.vault

TXFILE = sys.argv[1] if len(sys.argv) > 1 else "/tmp/genlayer_tx.json"
OUTFILE = sys.argv[2] if len(sys.argv) > 2 else "/tmp/genlayer_broadcast_result.json"
RPC = "https://studio-next.genlayer.com/api"
CHAIN_ID = 61997
VAULT_LABEL = "id-ewd6o7-imp-1789e5"

txj = json.load(open(TXFILE))
w3 = Web3(Web3.HTTPProvider(RPC))
acct = aa.vault.load_evm(VAULT_LABEL)
sender = acct.address
print("sender:", sender)
nonce = w3.eth.get_transaction_count(sender, "latest")
print("nonce:", nonce)
txobj = {"to": txj["to"], "from": sender, "data": txj["data"], "value": int(txj["value"])}
est = w3.manager.request_blocking("eth_estimateGas", [txobj])
est = int(est, 16) if isinstance(est, str) else int(est)
print("gas estimate:", est)
gas = int(est * 1.2)
print("gas limit (x1.2):", gas)
tx = {
    "to": txj["to"],
    "data": txj["data"],
    "value": int(txj["value"]),
    "gas": gas,
    "gasPrice": 0,
    "nonce": nonce,
    "chainId": CHAIN_ID,
}
signed = acct.sign_transaction(tx)
txhash = w3.eth.send_raw_transaction(signed.raw_transaction)
print("TX HASH:", txhash.hex())
json.dump({"txHash": txhash.hex(), "nonce": nonce, "gas": gas}, open(OUTFILE, "w"), indent=2)
print("wrote", OUTFILE)
