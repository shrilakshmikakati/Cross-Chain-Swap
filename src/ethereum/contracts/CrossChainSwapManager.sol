// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./HashTimeLockContract.sol";

/**
 * @title CrossChainSwapManager
 * @dev Manages cross-chain swaps using Hash Time Lock Contracts
 */
contract CrossChainSwapManager is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    HashTimeLockContract public immutable htlc;
    
    // Supported tokens for swapping
    mapping(address => bool) public supportedTokens;
    
    // Swap fees (in basis points, e.g., 50 = 0.5%)
    uint256 public swapFeeBasisPoints = 50;
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10% max
    
    // Fee recipient
    address public feeRecipient;
    
    // Minimum swap amounts per token
    mapping(address => uint256) public minSwapAmounts;
    
    // Maximum swap amounts per token
    mapping(address => uint256) public maxSwapAmounts;
    
    // Events
    event SwapInitiated(
        bytes32 indexed swapId,
        address indexed initiator,
        address indexed token,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock,
        string targetChain,
        string targetAddress
    );
    
    event SwapCompleted(
        bytes32 indexed swapId,
        address indexed recipient,
        bytes32 secret
    );
    
    event SwapRefunded(
        bytes32 indexed swapId,
        address indexed recipient
    );
    
    event TokenSupportUpdated(address indexed token, bool supported);
    event SwapLimitsUpdated(address indexed token, uint256 minAmount, uint256 maxAmount);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    struct SwapInfo {
        address token;
        uint256 amount;
        address initiator;
        string targetChain;
        string targetAddress;
        bool completed;
        bool refunded;
    }
    
    mapping(bytes32 => SwapInfo) public swaps;

    constructor(address _htlc) {
        require(_htlc != address(0), "Invalid HTLC address");
        htlc = HashTimeLockContract(_htlc);
        feeRecipient = msg.sender;
    }

    /**
     * @dev Initiate a cross-chain swap
     */
    function initiateSwap(
        address token,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock,
        string calldata targetChain,
        string calldata targetAddress
    ) external payable nonReentrant whenNotPaused returns (bytes32 swapId) {
        require(supportedTokens[token] || token == address(0), "Token not supported");
        require(amount > 0, "Amount must be greater than 0");
        require(timelock > block.timestamp, "Timelock must be in the future");
        require(timelock <= block.timestamp + 24 hours, "Timelock too far in future");
        require(bytes(targetChain).length > 0, "Target chain required");
        require(bytes(targetAddress).length > 0, "Target address required");
        
        // Check swap limits
        if (token != address(0)) {
            require(amount >= minSwapAmounts[token], "Amount below minimum");
            require(maxSwapAmounts[token] == 0 || amount <= maxSwapAmounts[token], "Amount above maximum");
        }
        
        // Calculate fee
        uint256 fee = (amount * swapFeeBasisPoints) / 10000;
        uint256 netAmount = amount - fee;
        
        if (token == address(0)) {
            // ETH swap
            require(msg.value == amount, "Incorrect ETH amount");
            
            // Create HTLC for net amount (3 parameters: recipient, hashLock, timelock)
            swapId = htlc.newContract{value: netAmount}(
                payable(msg.sender),
                hashLock,
                timelock
            );
            
            // Transfer fee to fee recipient
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
        } else {
            // ERC20 token swap
            require(msg.value == 0, "No ETH should be sent for token swaps");
            
            // Transfer tokens from user to this contract
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            
            // For ERC20 tokens, we need to handle the HTLC creation differently
            // Option 1: If your HTLC has a separate method for ERC20
            // Option 2: If your HTLC uses a unified approach but needs token transfer first
            
            // Transfer net amount to HTLC contract
            IERC20(token).safeTransfer(address(htlc), netAmount);
            
            // Create HTLC (assuming it can handle ERC20 if tokens are already transferred)
            swapId = htlc.newContract(
                payable(msg.sender),
                hashLock,
                timelock
            );
            
            // Transfer fee to fee recipient
            if (fee > 0) {
                IERC20(token).safeTransfer(feeRecipient, fee);
            }
        }
        
        // Store swap info
        swaps[swapId] = SwapInfo({
            token: token,
            amount: netAmount,
            initiator: msg.sender,
            targetChain: targetChain,
            targetAddress: targetAddress,
            completed: false,
            refunded: false
        });
        
        emit SwapInitiated(
            swapId,
            msg.sender,
            token,
            netAmount,
            hashLock,
            timelock,
            targetChain,
            targetAddress
        );
    }

    /**
     * @dev Complete a swap by revealing the secret
     */
    function completeSwap(bytes32 swapId, string calldata secret) external nonReentrant {
        SwapInfo storage swap = swaps[swapId];
        require(swap.amount > 0, "Swap not found");
        require(!swap.completed, "Swap already completed");
        require(!swap.refunded, "Swap already refunded");
        
        // Complete the HTLC
        htlc.withdraw(swapId, secret);
        
        swap.completed = true;
        emit SwapCompleted(swapId, msg.sender, keccak256(abi.encodePacked(secret)));
    }

    /**
     * @dev Refund a swap after timelock expiry
     */
    function refundSwap(bytes32 swapId) external nonReentrant {
        SwapInfo storage swap = swaps[swapId];
        require(swap.amount > 0, "Swap not found");
        require(!swap.completed, "Swap already completed");
        require(!swap.refunded, "Swap already refunded");
        require(msg.sender == swap.initiator, "Only initiator can refund");
        
        // Refund the HTLC
        htlc.refund(swapId);
        
        swap.refunded = true;
        emit SwapRefunded(swapId, msg.sender);
    }

    /**
     * @dev Get swap information
     */
    function getSwap(bytes32 swapId) external view returns (
        address token,
        uint256 amount,
        address initiator,
        string memory targetChain,
        string memory targetAddress,
        bool completed,
        bool refunded
    ) {
        SwapInfo storage swap = swaps[swapId];
        return (
            swap.token,
            swap.amount,
            swap.initiator,
            swap.targetChain,
            swap.targetAddress,
            swap.completed,
            swap.refunded
        );
    }

    // Admin functions
    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    function setSwapLimits(address token, uint256 minAmount, uint256 maxAmount) external onlyOwner {
        require(maxAmount == 0 || maxAmount >= minAmount, "Invalid limits");
        minSwapAmounts[token] = minAmount;
        maxSwapAmounts[token] = maxAmount;
        emit SwapLimitsUpdated(token, minAmount, maxAmount);
    }

    function setSwapFee(uint256 newFeeBasisPoints) external onlyOwner {
        require(newFeeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");
        uint256 oldFee = swapFeeBasisPoints;
        swapFeeBasisPoints = newFeeBasisPoints;
        emit FeeUpdated(oldFee, newFeeBasisPoints);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(oldRecipient, newFeeRecipient);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // Alternative methods if your HTLC contract has different method signatures
    // Uncomment and modify these if needed:
    
    /*
    function initiateERC20Swap(
        address token,
        uint256 amount,
        bytes32 hashLock,
        uint256 timelock,
        string calldata targetChain,
        string calldata targetAddress
    ) external nonReentrant whenNotPaused returns (bytes32 swapId) {
        // Implementation for contracts with separate ERC20 methods
        // You would need to adjust this based on your HTLC interface
    }
    */
}