import { createClient, abi } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { http, encodeFunctionData, zeroAddress } from 'viem';
import fs from 'fs';

const SENDER = '0x1789E592023c9229Ff966E8da7F17646d6A8bf33';
const CONSENSUS = studioDevnet.consensusMainContract.address;
const CODE = fs.readFileSync(new URL('../contract/PayProveEscrow.py', import.meta.url), 'utf8');

const client = createClient({ chain: studioDevnet, transport: http(studioDevnet.rpcUrls.default.http[0]) });

async function main() {
  const fees = await client.estimateTransactionFees({});
  console.log('feeValue (wei):', fees.feeValue.toString());
  console.log('feeValue (GEN):', (Number(fees.feeValue) / 1e18).toFixed(6));
  // Deploy: __init__ takes no args
  const calldataObj = abi.calldata.makeCalldataObject(undefined, [], undefined);
  const constructorCalldata = abi.calldata.encode(calldataObj);
  const serializedData = abi.transactions.serialize([CODE, constructorCalldata, false]);
  console.log('serialized deploy data len:', serializedData.length);
  const validUntil = BigInt(Math.floor(Date.now()/1000) + 3600);
  const params = {
    sender: SENDER,
    recipient: zeroAddress,
    numOfInitialValidators: BigInt(studioDevnet.defaultNumberOfInitialValidators),
    maxRotations: BigInt(studioDevnet.defaultConsensusMaxRotations),
    validUntil,
    saltNonce: 0n,
    userValue: 0n,
    feesDistribution: fees.distribution,
    txCalldata: serializedData,
    messageAllocations: fees.messageAllocations ?? [],
  };
  const data = encodeFunctionData({
    abi: studioDevnet.consensusMainContract.abi,
    functionName: 'addTransaction',
    args: [params],
  });
  const value = fees.feeValue;
  console.log('---TX---');
  console.log(JSON.stringify({ to: CONSENSUS, data, value: value.toString(), valueGen: (Number(value)/1e18).toFixed(6), validUntil: validUntil.toString() }));
}
main().catch(e => { console.error('BUILD FAIL:', e.message); process.exit(1); });
