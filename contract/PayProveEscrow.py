# v0.4.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
import re
from genlayer import *

MAX_ID = 64
MAX_TEXT = 1000

STYLE = """You are the judge of the Internet Court, the court for the agentic economy. An AI buyer agent paid an AI seller agent for a digital good or service through an x402-style payment. The payment is held in escrow by this contract. The buyer now disputes the deal, claiming the seller did not deliver as promised.

Your job is to decide, from the deal facts and the dispute reason only, whether the escrowed funds should be RELEASED to the seller (the seller delivered, or the buyer cannot show non-delivery) or REFUNDED to the buyer (the seller clearly did not deliver what was promised).

Be fair and brief. Do not invent facts that are not in the deal. If the dispute reason is vague or gives no concrete evidence of non-delivery, lean toward releasing the funds to the seller. If the reason concretely shows the seller failed to deliver the promised item, refund the buyer."""

FORMAT = """
Respond with JSON only, in this exact shape:
{"release_funds": true/false, "reply": "one or two sentences explaining the verdict in plain language"}
- "release_funds": true means release the escrowed funds to the seller.
- "release_funds": false means refund the escrowed funds to the buyer.
- "reply": one or two sentences, plain language, no markdown.
"""


def _normalize(s: str) -> str:
    return " ".join(s.strip().split())


def _valid_verdict(v) -> bool:
    return (
        isinstance(v, dict)
        and isinstance(v.get("release_funds"), bool)
        and isinstance(v.get("reply"), str)
        and len(v["reply"]) > 0
    )


def _new_deal(buyer: str, seller: str, item: str, amount: str) -> dict:
    return {
        "buyer": buyer,
        "seller": seller,
        "item": item,
        "amount": amount,
        "status": "created",
        "dispute_reason": "",
        "verdict": "",
        "outcome": "",
    }


class PayProveEscrow(gl.Contract):
    name: str
    deals: TreeMap[str, str]

    def __init__(self, name: str):
        self.name = name

    @gl.public.write
    def create_deal(self, deal_id: str, seller: str, item: str, amount: str) -> None:
        # Buyer (the caller) opens an x402-style purchase; funds are held in escrow.
        if not isinstance(deal_id, str) or not re.fullmatch(r"[A-Za-z0-9_:-]{1,64}", deal_id):
            raise gl.vm.UserError("[EXPECTED] deal_id must be 1-64 characters of [A-Za-z0-9_:-]")
        if self.deals.get(deal_id, ""):
            raise gl.vm.UserError("[EXPECTED] deal already exists")
        if not isinstance(seller, str) or not seller.strip():
            raise gl.vm.UserError("[EXPECTED] seller must be a non-empty address")
        if not isinstance(item, str) or not _normalize(item):
            raise gl.vm.UserError("[EXPECTED] item must be 1-1000 characters")
        if len(item) > MAX_TEXT:
            raise gl.vm.UserError("[EXPECTED] item must be 1-1000 characters")
        if not isinstance(amount, str) or not amount.strip():
            raise gl.vm.UserError("[EXPECTED] amount must be a non-empty string")
        buyer = gl.message.sender_address.as_hex
        deal = _new_deal(buyer, seller.strip(), _normalize(item), amount.strip())
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def confirm_delivery(self, deal_id: str) -> None:
        # Buyer confirms the seller delivered; escrow releases funds to the seller.
        stored = self.deals.get(deal_id, "")
        if not stored:
            raise gl.vm.UserError("[EXPECTED] deal not found")
        deal = json.loads(stored)
        buyer = gl.message.sender_address.as_hex
        if buyer.lower() != deal["buyer"].lower():
            raise gl.vm.UserError("[EXPECTED] only the buyer can confirm delivery")
        if deal["status"] != "created":
            raise gl.vm.UserError("[EXPECTED] deal is not awaiting delivery")
        deal["status"] = "delivered"
        deal["outcome"] = "release"
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def dispute(self, deal_id: str, reason: str) -> None:
        # Buyer disputes non-delivery; the deal moves to adjudication.
        stored = self.deals.get(deal_id, "")
        if not stored:
            raise gl.vm.UserError("[EXPECTED] deal not found")
        deal = json.loads(stored)
        buyer = gl.message.sender_address.as_hex
        if buyer.lower() != deal["buyer"].lower():
            raise gl.vm.UserError("[EXPECTED] only the buyer can dispute")
        if deal["status"] != "created":
            raise gl.vm.UserError("[EXPECTED] deal is not awaiting delivery")
        if not isinstance(reason, str) or not _normalize(reason):
            raise gl.vm.UserError("[EXPECTED] reason must be 1-1000 characters")
        if len(reason) > MAX_TEXT:
            raise gl.vm.UserError("[EXPECTED] reason must be 1-1000 characters")
        deal["status"] = "disputed"
        deal["dispute_reason"] = _normalize(reason)
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.write
    def adjudicate(self, deal_id: str) -> None:
        # Internet Court: LLM consensus decides release vs refund. Anyone may trigger it.
        stored = self.deals.get(deal_id, "")
        if not stored:
            raise gl.vm.UserError("[EXPECTED] deal not found")
        deal = json.loads(stored)
        if deal["status"] != "disputed":
            raise gl.vm.UserError("[EXPECTED] deal is not disputed")
        prompt = STYLE
        prompt += (
            "\nDEAL FACTS\n"
            + "Buyer: " + deal["buyer"] + "\n"
            + "Seller: " + deal["seller"] + "\n"
            + "Item promised: " + deal["item"] + "\n"
            + "Amount held in escrow: " + deal["amount"] + " GEN\n"
            + "Buyer dispute reason: " + deal["dispute_reason"] + "\n"
            + FORMAT
        )

        def leader_fn() -> dict:
            try:
                raw = gl.nondet.exec_prompt(prompt, response_format="json")
            except ValueError:
                raw = None
            if isinstance(raw, str):
                try:
                    raw = json.loads(raw)
                except Exception:
                    raw = None
            return raw if _valid_verdict(raw) else {"release_funds": True, "reply": "No clear evidence of non-delivery; funds released to the seller."}

        def validator_fn(leaders_res: gl.vm.Result) -> bool:
            if not isinstance(leaders_res, gl.vm.Return) or not _valid_verdict(leaders_res.calldata):
                return False
            return leader_fn()["release_funds"] == leaders_res.calldata["release_funds"]

        verdict = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        if not _valid_verdict(verdict):
            raise gl.vm.UserError("[LLM_ERROR] invalid consensus verdict")
        if verdict["release_funds"]:
            deal["status"] = "resolved_release"
            deal["outcome"] = "release"
        else:
            deal["status"] = "resolved_refund"
            deal["outcome"] = "refund"
        deal["verdict"] = verdict["reply"]
        self.deals[deal_id] = json.dumps(deal)

    @gl.public.view
    def get_deal(self, deal_id: str) -> str:
        return self.deals.get(deal_id, "")

    @gl.public.view
    def get_status(self, deal_id: str) -> str:
        stored = self.deals.get(deal_id, "")
        if not stored:
            return ""
        return json.loads(stored)["status"]

    @gl.public.view
    def get_name(self) -> str:
        return self.name
