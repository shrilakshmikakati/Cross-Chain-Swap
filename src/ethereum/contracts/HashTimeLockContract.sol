// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title HashTimeLockContract
 * @dev Implements Hash Time Locked Contracts for cross-chain atomic swaps
 */
contract HashTimeLockContract is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct HTLC {
        address sender;
        address receiver;
        address tokenContract;
        uint256 amount;
        bytes32 hashLock;
        uint256 timelock;
        bool withdrawn;
        bool refunded;
        string preimage;
    }

    mapping(bytes32 => HTLC) public contracts;
    mapping(address => bytes32[]) public userContracts;

    event HTLCNew(
        bytes32 indexed contractId,
        address indexed sender,
        address indexed receiver,
        address tokenContract,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock
    );

    event HTLCWithdraw(bytes32 indexed contractId, address indexed receiver, string preimage);
    event HTLCRefund(bytes32 indexed contractId, address indexed sender);

    modifier fundsSent() {
        require(msg.value > 0, "No funds sent");
        _;
    }

    modifier futureTimelock(uint256 _time) {
        require(_time > block.timestamp, "Timelock must be in the future");
        _;
    }

    modifier contractExists(bytes32 _contractId) {
        require(hasContract(_contractId), "Contract does not exist");
        _;
    }

    modifier hashlockMatches(bytes32 _contractId, string memory _preimage) {
        require(
            contracts[_contractId].hashLock == keccak256(abi.encodePacked(_preimage)),
            "Hash lock does not match preimage"
        );
        _;
    }

    modifier withdrawable(bytes32 _contractId) {
        require(contracts[_contractId].receiver == msg.sender, "Not authorized to withdraw");
        require(contracts[_contractId].withdrawn == false, "Already withdrawn");
        require(contracts[_contractId].timelock > block.timestamp, "Timelock has expired");
        _;
    }

    modifier refundable(bytes32 _contractId) {
        require(contracts[_contractId].sender == msg.sender, "Not authorized to refund");
        require(contracts[_contractId].refunded == false, "Already refunded");
        require(contracts[_contractId].withdrawn == false, "Already withdrawn");
        require(contracts[_contractId].timelock <= block.timestamp, "Timelock not yet expired");
        _;
    }

    /**
     * @dev Create a new HTLC for ETH
     * @param _receiver Address of the receiver
     * @param _hashLock Hash of the secret
     * @param _timelock Unix timestamp when the lock expires
     * @return contractId The ID of the created contract
     */
    function newContract(
        address _receiver,
        bytes32 _hashLock,
        uint256 _timelock
    )
        public
        payable
        fundsSent
        futureTimelock(_timelock)
        returns (bytes32 contractId)
    {
        contractId = keccak256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                msg.value,
                _hashLock,
                _timelock
            )
        );

        require(!hasContract(contractId), "Contract already exists");

        contracts[contractId] = HTLC(
            msg.sender,
            _receiver,
            address(0), // ETH
            msg.value,
            _hashLock,
            _timelock,
            false,
            false,
            ""
        );

        userContracts[msg.sender].push(contractId);
        userContracts[_receiver].push(contractId);

        emit HTLCNew(
            contractId,
            msg.sender,
            _receiver,
            address(0),
            msg.value,
            _hashLock,
            _timelock
        );
    }

    /**
     * @dev Create a new HTLC for ERC20 tokens
     * @param _receiver Address of the receiver
     * @param _hashLock Hash of the secret
     * @param _timelock Unix timestamp when the lock expires
     * @param _tokenContract Address of the ERC20 token contract
     * @param _amount Amount of tokens to lock
     * @return contractId The ID of the created contract
     */
    function newContractERC20(
        address _receiver,
        bytes32 _hashLock,
        uint256 _timelock,
        address _tokenContract,
        uint256 _amount
    )
        public
        futureTimelock(_timelock)
        returns (bytes32 contractId)
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(_tokenContract != address(0), "Invalid token contract");

        contractId = keccak256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                _amount,
                _hashLock,
                _timelock,
                _tokenContract
            )
        );

        require(!hasContract(contractId), "Contract already exists");

        // Transfer tokens to this contract
        IERC20(_tokenContract).safeTransferFrom(msg.sender, address(this), _amount);

        contracts[contractId] = HTLC(
            msg.sender,
            _receiver,
            _tokenContract,
            _amount,
            _hashLock,
            _timelock,
            false,
            false,
            ""
        );

        userContracts[msg.sender].push(contractId);
        userContracts[_receiver].push(contractId);

        emit HTLCNew(
            contractId,
            msg.sender,
            _receiver,
            _tokenContract,
            _amount,
            _hashLock,
            _timelock
        );
    }

    /**
     * @dev Withdraw funds from an HTLC by providing the preimage
     * @param _contractId ID of the HTLC
     * @param _preimage The secret that hashes to the hashlock
     */
    function withdraw(bytes32 _contractId, string memory _preimage)
        public
        contractExists(_contractId)
        hashlockMatches(_contractId, _preimage)
        withdrawable(_contractId)
        nonReentrant
    {
        HTLC storage htlc = contracts[_contractId];
        htlc.preimage = _preimage;
        htlc.withdrawn = true;

        if (htlc.tokenContract == address(0)) {
            // ETH withdrawal
            payable(htlc.receiver).transfer(htlc.amount);
        } else {
            // ERC20 withdrawal
            IERC20(htlc.tokenContract).safeTransfer(htlc.receiver, htlc.amount);
        }

        emit HTLCWithdraw(_contractId, htlc.receiver, _preimage);
    }

    /**
     * @dev Refund funds from an expired HTLC
     * @param _contractId ID of the HTLC
     */
    function refund(bytes32 _contractId)
        public
        contractExists(_contractId)
        refundable(_contractId)
        nonReentrant
    {
        HTLC storage htlc = contracts[_contractId];
        htlc.refunded = true;

        if (htlc.tokenContract == address(0)) {
            // ETH refund
            payable(htlc.sender).transfer(htlc.amount);
        } else {
            // ERC20 refund
            IERC20(htlc.tokenContract).safeTransfer(htlc.sender, htlc.amount);
        }

        emit HTLCRefund(_contractId, htlc.sender);
    }

    /**
     * @dev Get contract details
     * @param _contractId ID of the HTLC
     * @return sender Address of the sender
     * @return receiver Address of the receiver
     * @return tokenContract Address of the token contract (address(0) for ETH)
     * @return amount Amount locked in the contract
     * @return hashLock Hash of the secret
     * @return timelock Unix timestamp when the lock expires
     * @return withdrawn Whether the contract has been withdrawn
     * @return refunded Whether the contract has been refunded
     * @return preimage The revealed secret (empty string if not withdrawn)
     */
    function getContract(bytes32 _contractId)
        public
        view
        returns (
            address sender,
            address receiver,
            address tokenContract,
            uint256 amount,
            bytes32 hashLock,
            uint256 timelock,
            bool withdrawn,
            bool refunded,
            string memory preimage
        )
    {
        if (hasContract(_contractId) == false) {
            return (address(0), address(0), address(0), 0, 0, 0, false, false, "");
        }
        HTLC storage htlc = contracts[_contractId];
        return (
            htlc.sender,
            htlc.receiver,
            htlc.tokenContract,
            htlc.amount,
            htlc.hashLock,
            htlc.timelock,
            htlc.withdrawn,
            htlc.refunded,
            htlc.preimage
        );
    }

    /**
     * @dev Get all contract IDs for a user
     * @param _user Address of the user
     * @return contractIds Array of contract IDs associated with the user
     */
    function getUserContracts(address _user) public view returns (bytes32[] memory contractIds) {
        return userContracts[_user];
    }

    /**
     * @dev Check if a contract exists
     * @param _contractId ID of the HTLC
     * @return exists True if contract exists, false otherwise
     */
    function hasContract(bytes32 _contractId) public view returns (bool exists) {
        return contracts[_contractId].sender != address(0);
    }

    /**
     * @dev Get the status of an HTLC
     * @param _contractId ID of the HTLC
     * @return status Contract status: 0=does not exist, 1=active, 2=withdrawn, 3=refunded, 4=expired
     */
    function getContractStatus(bytes32 _contractId) public view returns (uint8 status) {
        if (!hasContract(_contractId)) {
            return 0; // Does not exist
        }

        HTLC storage htlc = contracts[_contractId];
        
        if (htlc.withdrawn) {
            return 2; // Withdrawn
        }
        
        if (htlc.refunded) {
            return 3; // Refunded
        }
        
        if (block.timestamp >= htlc.timelock) {
            return 4; // Expired
        }
        
        return 1; // Active
    }

    /**
     * @dev Emergency function to recover stuck tokens (only for development)
     * @param _tokenContract Address of the token contract (address(0) for ETH)
     * @param _amount Amount to recover
     * @notice In production, this should be removed or have proper governance
     */
    function emergencyWithdraw(address _tokenContract, uint256 _amount) external {
        require(msg.sender == address(this), "Not authorized"); // Replace with proper access control
        
        if (_tokenContract == address(0)) {
            payable(msg.sender).transfer(_amount);
        } else {
            IERC20(_tokenContract).safeTransfer(msg.sender, _amount);
        }
    }
}