const { ethers } = require('ethers');
require('dotenv').config();
const MinimalForwarderABI = require('./src/abi/MinimalForwarder.json').abi;  // Adjust as before

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet('PRIVATE_KEY', provider);  // Use test key!

const forwarderAddress = process.env.FORWARDER_ADDRESS;
const forwarder = new ethers.Contract(forwarderAddress, MinimalForwarderABI, provider);

async function signRequest() {
    const chainId = await signer.getChainId();
    const nonce = await forwarder.getNonce(signer.address);

    const request = {
        from: signer.address,
        to: '0xYOUR_TO_ADDRESS',
        value: 0n,
        gas: 100000n,
        nonce: nonce,
        data: '0x'  // Or your calldata
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
    console.log('Request:', JSON.stringify(request));
    console.log('Signature:', signature);
}

signRequest();