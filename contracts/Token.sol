
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DataToken is ERC20, Ownable {
    address public registryAddress;

    constructor() ERC20("DataToken", "DSET") Ownable(msg.sender) {}

    
    function setRegistryAddress(address _registryAddress) external onlyOwner {
        registryAddress = _registryAddress;
    }

    
    function mint(address to, uint256 amount) external {
        require(msg.sender == registryAddress || msg.sender == owner(), "Not authorized to mint");
        _mint(to, amount);
    }
}
