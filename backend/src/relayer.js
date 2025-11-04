// relayer.js
const express = require('express');
const { ethers } = require('ethers');
require("dotenv").config();
const MinimalForwarderABI = require("./abi/MinimalForwarder.json").abi;


const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    // NOTE: If the provider is slow to connect, this might throw an error if called too early.
    res.json({ status: 'ok', forwarderAddress: forwarder.address });
});

// Initialize provider and relayer wallet
// NOTE: Make sure RPC_URL and RELAYER_PRIVATE_KEY are correctly set in your .env file
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);

provider.getNetwork()
    .then(net => console.log(`Successful Provider Check: Connected to Chain ID ${net.chainId}`))
    .catch(e => console.error('CRITICAL STARTUP ERROR: Provider connection failed:', e.message));

// Forwarder contract
const forwarder = new ethers.Contract(
    process.env.FORWARDER_ADDRESS,
    MinimalForwarderABI,
    relayerWallet
);

app.post('/relay', async (req, res) => {
    try {
        const { request, signature } = req.body;

        // Verify the signature (optional but recommended)
        const network = await provider.getNetwork();
        const domain = {
            name: 'MinimalForwarder',
            version: '0.0.1',
            chainId: network.chainId,
            verifyingContract: forwarder.address
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

        // This line must execute BEFORE the console.log statements
        const recoveredAddress = ethers.verifyTypedData(
            domain,
            types,
            request,
            signature
        );
        
        // --- FIXED LOGGING PLACEMENT ---
        // These logs are now safe to use
        console.log("Domain used for verification:", domain);
        console.log("Request 'from' address:", request.from);
        console.log("Recovered address:", recoveredAddress);
        // --------------------------------

        if (recoveredAddress.toLowerCase() !== request.from.toLowerCase()) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Execute the meta-transaction (relayer pays gas)
        const tx = await forwarder.execute(request, signature, {
            gasLimit: request.gas
        });

        const receipt = await tx.wait();

        res.json({
            success: true,
            txHash: receipt.transactionHash,
            gasUsed: receipt.gasUsed.toString()
        });

    } catch (error) {
        console.error('Relayer error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Relayer service running on port ${PORT}`);
});