// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {InsurancePool} from "./InsurancePool.sol";
import {InsuranceToken} from "./InsuranceToken.sol";

contract InsuranceOrderbook is Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for InsuranceToken;

    InsurancePool public immutable insurancePool;
    IERC20 public immutable collateralToken;
    bool public isMarketSettling;
    uint256 public feeRate = 50; // Fee in basis points (0.5%)
    address public feeRecipient;

    struct Order {
        address maker;
        uint256 strikePrice;
        uint256 amount;
        uint256 price;
        bool isClaimTokenOrder; // true if selling claim tokens, false if selling insurance (not holding tokens yet)
    }

    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId = 1;
    mapping(address => uint256) public userCollateralBalance;

    event OrderCreated(uint256 indexed orderId, address indexed maker, uint256 strikePrice, uint256 amount, uint256 price, bool isClaimTokenOrder);
    event OrderCanceled(uint256 indexed orderId, address indexed canceledBy);
    event OrderFilled(uint256 indexed orderId, address indexed taker, uint256 amount);
    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event MarketSettlingStatusChanged(bool isSettling);
    event FeeRateUpdated(uint256 newFeeRate);
    event FeeRecipientUpdated(address newFeeRecipient);
    event FeeCollected(uint256 amount);

    modifier whenNotSettling() {
        require(!isMarketSettling, "Market is settling");
        _;
    }

    constructor(InsurancePool _insurancePool) Ownable(msg.sender) {
        insurancePool = _insurancePool;
        collateralToken = _insurancePool.COLLATERAL_TOKEN();
        isMarketSettling = false;
        feeRecipient = msg.sender;
    }

    // Set market settling status (only owner)
    function setMarketSettling(bool settlingStatus) external onlyOwner {
        isMarketSettling = settlingStatus;
        emit MarketSettlingStatusChanged(settlingStatus);
    }

    // Set fee rate (only owner)
    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, "Fee rate too high"); // Max 10%
        feeRate = _feeRate;
        emit FeeRateUpdated(_feeRate);
    }

    // Set fee recipient (only owner)
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    // Deposit collateral for creating orders
    function depositCollateral(uint256 amount) external {
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        userCollateralBalance[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    // Withdraw unused collateral
    function withdrawCollateral(uint256 amount) external {
        require(userCollateralBalance[msg.sender] >= amount, "Insufficient balance");
        userCollateralBalance[msg.sender] -= amount;
        collateralToken.safeTransfer(msg.sender, amount);
        emit CollateralWithdrawn(msg.sender, amount);
    }

    // Create order to sell claim tokens that user already owns
    function createClaimTokenOrder(uint256 strikePrice, uint256 amount, uint256 price) external whenNotSettling returns (uint256 orderId) {
        (, InsuranceToken claimToken) = insurancePool.getInsuranceTokens(strikePrice);
        require(address(claimToken) != address(0), "Strike price not available");
        require(claimToken.balanceOf(msg.sender) >= amount, "Insufficient claim tokens");
        
        // Transfer claim tokens to this contract
        claimToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Create order
        orderId = nextOrderId++;
        orders[orderId] = Order({
            maker: msg.sender,
            strikePrice: strikePrice,
            amount: amount,
            price: price,
            isClaimTokenOrder: true
        });
        
        emit OrderCreated(orderId, msg.sender, strikePrice, amount, price, true);
    }
    
    // Create order to sell insurance (user doesn't have tokens yet)
    function createInsuranceOrder(uint256 strikePrice, uint256 amount, uint256 price) external whenNotSettling returns (uint256 orderId) {
        // Calculate collateral needed if the order is filled
        uint256 collateralNeeded = calculateSellerCollateral(strikePrice, amount);
        require(userCollateralBalance[msg.sender] >= collateralNeeded, "Insufficient collateral deposited");
        
        // Create order
        orderId = nextOrderId++;
        orders[orderId] = Order({
            maker: msg.sender,
            strikePrice: strikePrice,
            amount: amount,
            price: price,
            isClaimTokenOrder: false
        });
        
        emit OrderCreated(orderId, msg.sender, strikePrice, amount, price, false);
    }
    
    // Cancel an existing order
    function cancelOrder(uint256 orderId) external {
        Order memory order = orders[orderId];
        require(order.maker == msg.sender, "Not order maker");
        require(order.amount > 0, "Order already filled or canceled");
        
        // Return claim tokens if it was a claim token order
        if (order.isClaimTokenOrder) {
            (, InsuranceToken claimToken) = insurancePool.getInsuranceTokens(order.strikePrice);
            claimToken.safeTransfer(order.maker, order.amount);
        }
        
        delete orders[orderId];
        emit OrderCanceled(orderId, msg.sender);
    }
    
    // Fill an order (buy insurance)
    function fillOrder(uint256 orderId, uint256 amount) external whenNotSettling {
        Order storage order = orders[orderId];
        require(order.amount > 0, "Order filled or canceled");
        require(amount <= order.amount, "Amount exceeds order size");
        
        uint256 paymentAmount = amount * order.price / 1e18;
        uint256 feeAmount = paymentAmount * feeRate / 10000;
        uint256 sellerAmount = paymentAmount - feeAmount;
        
        if (order.isClaimTokenOrder) {
            // Simple case: seller already has claim tokens
            // Buyer pays the price plus fee
            collateralToken.safeTransferFrom(msg.sender, address(this), paymentAmount);
            
            // Transfer payment to seller (minus fee)
            collateralToken.safeTransfer(order.maker, sellerAmount);
            
            // Transfer fee to fee recipient
            if (feeAmount > 0) {
                collateralToken.safeTransfer(feeRecipient, feeAmount);
                emit FeeCollected(feeAmount);
            }
            
            // Transfer claim tokens to the buyer
            (, InsuranceToken claimToken) = insurancePool.getInsuranceTokens(order.strikePrice);
            claimToken.safeTransfer(msg.sender, amount);
        } else {
            // Complex case: seller doesn't have tokens yet
            // Buyer pays the price plus fee
            collateralToken.safeTransferFrom(msg.sender, address(this), paymentAmount);
            
            // Calculate collateral needed for minting
            uint256 collateralNeeded = calculateSellerCollateral(order.strikePrice, amount);
            
            // Ensure seller has enough collateral
            require(userCollateralBalance[order.maker] >= collateralNeeded, "Seller has insufficient collateral");
            
            // Reduce seller's collateral balance
            userCollateralBalance[order.maker] -= collateralNeeded;
            
            // Approve transfer to insurance pool
            collateralToken.approve(address(insurancePool), collateralNeeded);
            
            // Mint new insurance tokens
            insurancePool.issueInsurance(
                order.strikePrice, 
                amount, 
                order.maker,    // Collateral token goes to the seller
                msg.sender      // Claim token goes to the buyer
            );
            
            // Pay the seller (minus fee)
            collateralToken.safeTransfer(order.maker, sellerAmount);
            
            // Transfer fee to fee recipient
            if (feeAmount > 0) {
                collateralToken.safeTransfer(feeRecipient, feeAmount);
                emit FeeCollected(feeAmount);
            }
        }
        
        // Update order
        order.amount -= amount;
        if (order.amount == 0) {
            delete orders[orderId];
        }
        
        emit OrderFilled(orderId, msg.sender, amount);
    }
    
    // Calculate the collateral needed from seller to issue insurance
    function calculateSellerCollateral(uint256 strikePrice, uint256 amount) public pure returns (uint256) {
        // Scale down to token decimals (6 for USDC)
        return (amount * strikePrice / 1e18 * 1e6 / 1e18) + 1;
    }
    
    // Check if an order can be filled with the maker's current collateral
    function isOrderFillable(uint256 orderId) external view returns (bool) {
        Order memory order = orders[orderId];
        if (order.amount == 0) {
            return false; // Order doesn't exist or is already filled
        }
        
        if (order.isClaimTokenOrder) {
            return true; // Claim token orders are always fillable (tokens already deposited)
        } else {
            uint256 collateralNeeded = calculateSellerCollateral(order.strikePrice, order.amount);
            return userCollateralBalance[order.maker] >= collateralNeeded;
        }
    }
    
    // Get maximum fillable amount for an order based on maker's current collateral
    function getMaxFillableAmount(uint256 orderId) public view returns (uint256) {
        Order memory order = orders[orderId];
        if (order.amount == 0) {
            return 0; // Order doesn't exist or is already filled
        }
        
        if (order.isClaimTokenOrder) {
            return order.amount; // Claim token orders are always fully fillable
        } else {
            uint256 availableCollateral = userCollateralBalance[order.maker];
            
            if (availableCollateral == 0) {
                return 0;
            }
            
            // Formula: max amount = availableCollateral * 1e18 / strikePrice
            // But we need to subtract 1 wei per order to account for rounding
            if (availableCollateral <= 1) {
                return 0;
            }
            
            availableCollateral -= 1; // Account for the +1 in calculateSellerCollateral
            
            // Calculate maximum amount, adjusting for decimals
            uint256 maxAmount = (availableCollateral * 1e18 * 1e18 / 1e6) / order.strikePrice;
            
            // Return the lesser of maxAmount and order.amount
            return maxAmount < order.amount ? maxAmount : order.amount;
        }
    }
    
    // View function to get order details
    function getOrder(uint256 orderId) external view returns (
        address maker,
        uint256 strikePrice,
        uint256 amount,
        uint256 price,
        bool isClaimTokenOrder
    ) {
        Order memory order = orders[orderId];
        return (
            order.maker,
            order.strikePrice,
            order.amount,
            order.price,
            order.isClaimTokenOrder
        );
    }
}