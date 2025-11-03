// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Simple minimal forwarder for meta-transactions.
 * This contract verifies and executes relayed transactions on behalf of another user.
 * It is taken from OpenZeppelin Contracts v4.9.0.
 */
contract MinimalForwarder {
    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    mapping(address => uint256) private _nonces;

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                req.from,
                req.to,
                req.value,
                req.gas,
                req.nonce,
                keccak256(req.data)
            )
        );
        return _nonces[req.from] == req.nonce && _verifySignature(req.from, hash, signature);
    }

    function execute(ForwardRequest calldata req, bytes calldata signature)
        public
        payable
        returns (bool, bytes memory)
    {
        require(verify(req, signature), "MinimalForwarder: signature does not match request");
        _nonces[req.from] = req.nonce + 1;

        (bool success, bytes memory returndata) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );

        // Ensure relayer is not paying for leftover gas
        assert(gasleft() > req.gas / 63);

        return (success, returndata);
    }

    function _verifySignature(address signer, bytes32 hash, bytes calldata signature) internal pure returns (bool) {
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);
        address recovered = ecrecover(ethSignedHash, v, r, s);
        return recovered == signer;
    }

    function _splitSignature(bytes memory sig)
        internal
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }
}
