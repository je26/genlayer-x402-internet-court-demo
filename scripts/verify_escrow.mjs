// Read a deal back from the deployed PayProveEscrow contract (Studio Next).
// Usage: node verify_escrow.mjs [contractAddress] [dealId]
// Defaults to the live deployment + deal-001.
import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { http } from 'viem';

const addr = process.argv[2] || '0x072a9e7c549C81f64FBE96990eB122DCd85E18b0';
const dealId = process.argv[3] || 'deal-001';
const client = createClient({ chain: studioDevnet, transport: http(studioDevnet.rpcUrls.default.http[0]) });
const s = await client.readContract({ address: addr, functionName: 'get_status', args: [dealId] });
console.log(`get_status(${dealId}) =>`, JSON.stringify(s));
const d = await client.readContract({ address: addr, functionName: 'get_deal', args: [dealId] });
console.log(`get_deal(${dealId}) =>`, JSON.stringify(d));
