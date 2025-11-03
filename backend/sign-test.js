const { ethers } = require('ethers');
require('dotenv').config();
const MinimalForwarderABI = require('./src/abi/MinimalForwarder.json').abi;   // Plain ABI array (no .abi if raw)

async function generateTestRequest() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet('PRIVATE_KEY', provider);  // Use a test wallet (e.g., new one with Sepolia faucet ETH)
    const forwarderAddress = process.env.FORWARDER_ADDRESS;
    const forwarder = new ethers.Contract(forwarderAddress, MinimalForwarderABI, provider);

    const network = await provider.getNetwork();
    const chainId = network.chainId;
    const nonce = await forwarder.getNonce(signer.address);  // Fetch real nonce

    const request = {
        from: signer.address,
        to: forwarderAddress,  // Echo back for simple test (or your target contract)
        value: 0n,  // BigInt for ethers v6
        gas: 100000n,
        nonce: nonce,
        data: '0x'  // Empty calldata for no-op test
    };

    const domain = {
        name: 'MinimalForwarder',
        version: '0.0.1',
        chainId,
        verifyingContract: forwarderAddress
    };

    const types = {
        ForwardRequest: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'gas', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'data', type: 'bytes' }
        ]
    };

    const signature = await signer.signTypedData(domain, types, request);
    
    console.log('=== Test Data ===');
    console.log('Chain ID:', chainId);
    console.log('Nonce:', nonce.toString());
    console.log('Request:', JSON.stringify(request, (k, v) => typeof v === 'bigint' ? v.toString() : v));
    console.log('Signature:', signature);
    console.log('Signer Address:', signer.address);
    console.log('\nCopy the Request JSON and Signature into your curl command!');
}

generateTestRequest().catch(console.error);