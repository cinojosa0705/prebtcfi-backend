// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {InsuranceToken} from "./InsuranceToken.sol";

contract InsurancePool is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable COLLATERAL_TOKEN;

    struct InsuranceTokens {
        InsuranceToken collateralToken;
        InsuranceToken claimToken;
    }

    mapping(uint256 => InsuranceTokens) public getInsuranceTokens;
    bool public finalized;
    uint256 public FinalPrice;

    event NewStrikePrice(uint256 indexed strikePrice, address collateralToken, address claimToken);
    event InsuranceIssued(uint256 indexed strikePrice, address indexed user, uint256 amount, address collateralRecipient, address claimRecipient);
    event InsuranceRedeemed(uint256 indexed strikePrice, address indexed user, uint256 amount);
    event Finalized(uint256 finalPrice);
    event InsuranceClaimed(uint256 indexed strikePrice, address indexed user, uint256 totalClaimed);

    modifier whenNotFinalized() {
        require(!finalized, "Already finalized");
        _;
    }

    modifier whenFinalized() {
        require(finalized, "Not finalized");
        _;
    }

    constructor(IERC20 collateralToken) Ownable(msg.sender) {
        COLLATERAL_TOKEN = collateralToken;
    }

    function issueInsurance(uint256 strikePrice, uint256 amount, address collateralTokenRecipient, address claimTokenRecipient) external whenNotFinalized {
        InsuranceTokens memory insuranceTokens = getInsuranceTokens[strikePrice];
        if (address(insuranceTokens.collateralToken) == address(0)) {
            insuranceTokens = InsuranceTokens(
                new InsuranceToken(),
                new InsuranceToken()
            );
            getInsuranceTokens[strikePrice] = insuranceTokens;
            emit NewStrikePrice(strikePrice, address(insuranceTokens.collateralToken), address(insuranceTokens.claimToken));
        }

        // Scale down to token decimals (6 for USDC)
        uint256 collateralAmount = amount * strikePrice / 1e18 * 1e6 / 1e18 + 1;
        COLLATERAL_TOKEN.safeTransferFrom(msg.sender, address(this), collateralAmount);

        insuranceTokens.collateralToken.mint(collateralTokenRecipient, amount);
        insuranceTokens.claimToken.mint(claimTokenRecipient, amount);

        emit InsuranceIssued(strikePrice, msg.sender, amount, collateralTokenRecipient, claimTokenRecipient);
    }

    function redeemInsurance(uint256 strikePrice, uint256 amount) external whenNotFinalized returns (uint256 collateralAmount) {
        InsuranceTokens memory insuranceTokens = getInsuranceTokens[strikePrice];
        require(address(insuranceTokens.collateralToken) != address(0), "invalid strike price");
        require(insuranceTokens.collateralToken.balanceOf(msg.sender) >= amount && insuranceTokens.claimToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Scale down to token decimals (6 for USDC)
        collateralAmount = amount * strikePrice / 1e18 * 1e6 / 1e18;

        insuranceTokens.collateralToken.burn(msg.sender, amount);
        insuranceTokens.claimToken.burn(msg.sender, amount);

        COLLATERAL_TOKEN.safeTransfer(msg.sender, collateralAmount);

        emit InsuranceRedeemed(strikePrice, msg.sender, amount);
    }

    function finalize(uint256 finalPrice) external onlyOwner whenNotFinalized {
        finalized = true;
        FinalPrice = finalPrice;
        emit Finalized(finalPrice);
    }

    function settleInsurance(uint256[] calldata strikePrices) public whenFinalized returns(uint256 amountClaimed) {
        uint256 finalPrice = FinalPrice;
        for (uint i = 0; i < strikePrices.length; i++) 
        {
            uint256 strikePrice = strikePrices[i];
            InsuranceTokens memory insuranceTokens = getInsuranceTokens[strikePrice];
            if (address(insuranceTokens.collateralToken) == address(0)) continue;
            uint256 collateralBalance = insuranceTokens.collateralToken.balanceOf(msg.sender);
            uint256 claimBalance = insuranceTokens.claimToken.balanceOf(msg.sender);

            amountClaimed += collateralBalance * finalPrice / 1e18 * 1e6 / 1e18;
            if (finalPrice < strikePrice) {
                amountClaimed += claimBalance * (strikePrice - finalPrice) / 1e18 * 1e6 / 1e18;
            }

            if (collateralBalance > 0) {
                insuranceTokens.collateralToken.burn(msg.sender, collateralBalance);
            }
            if (claimBalance > 0) {
                insuranceTokens.claimToken.burn(msg.sender, claimBalance);
            }

            emit InsuranceClaimed(strikePrice, msg.sender, amountClaimed);
        }
        
        COLLATERAL_TOKEN.safeTransfer(msg.sender, amountClaimed);
    }

}