// Build an addTransaction for calling a method on an existing intelligent contract.
// Usage: node build_call.mjs <contractAddress> <functionName> <jsonArgsArray> [valueGen]
// Writes the TX JSON to stdout (---TX--- block).
import { createClient, abi } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { http, encodeFunctionData } from 'viem';

const SENDER = '0x1789E592023c9229Ff966E8da7F17646d6A8bf33';
const CONSENSUS = studioDevnet.consensusMainContract.address;
const [,, address, functionName, argsJson, valueGen] = process.argv;
if (!address || !functionName || argsJson === undefined) {
  console.error('usage: node build_call.mjs <contract> <function> <jsonArgs> [valueGen]');
  process.exit(1);
}
const callArgs = JSON.parse(argsJson);
const client = createClient({ chain: studioDevnet, transport: http(studioDevnet.rpcUrls.default.http[0]) });

async function main() {
  const fees = await client.estimateTransactionFees({});
  // Method call: data = [encode(makeCalldataObject(fn, args, kwargs)), leaderOnly]
  const calldataObj = abi.calldata.makeCalldataObject(functionName, callArgs, undefined);
  const methodCalldata = abi.calldata.encode(calldataObj);
  const serializedData = abi.transactions.serialize([methodCalldata, false]);
  const validUntil = BigInt(Math.floor(Date.now()/1000) + 3600);
  const userValue = valueGen ? BigInt(Math.round(parseFloat(valueGen) * 1e18)) : 0n;
  const params = {
    sender: SENDER,
    recipient: address,
    numOfInitialValidators: BigInt(studioDevnet.defaultNumberOfInitialValidators),
    maxRotations: BigInt(studioDevnet.defaultConsensusMaxRotations),
    validUntil,
    saltNonce: 0n,
    userValue,
    feesDistribution: fees.distribution,
    txCalldata: serializedData,
    messageAllocations: fees.messageAllocations ?? [],
  };
  const data = encodeFunctionData({
    abi: studioDevnet.consensusMainContract.abi,
    functionName: 'addTransaction',
    args: [params],
  });
  const value = fees.feeValue + userValue;
  console.log('---TX---');
  console.log(JSON.stringify({ to: CONSENSUS, data, value: value.toString(), valueGen: (Number(value)/1e18).toFixed(6), validUntil: validUntil.toString(), fn: functionName, args: callArgs }));
}
main().catch(e => { console.error('BUILD FAIL:', e.message); process.exit(1); });
