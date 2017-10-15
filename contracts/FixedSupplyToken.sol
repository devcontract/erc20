pragma solidity ^0.4.8;


import "./ERC20Interface.sol";


/**
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20

This is a contract for a fixed supply coin.
*/
contract FixedSupplyToken is ERC20Interface {

    // meta data
    string public constant symbol = "EX1";

    string public constant name = "ERC20 Token";

    uint256 public constant decimals = 18;

    uint256 _totalSupply = 10 * (10 ** 6) * 10 ** decimals; // ten million

    // Owner of this contract
    address public owner;

    // Balances for each account
    mapping (address => uint256) balances;

    // Owner of account approves the transfer of an amount to another account owner -> (recipient -> amount)
    mapping (address => mapping (address => uint256)) allowed;

    // Constructor
    // the creator gets all the tokens initially
    function FixedSupplyToken() {
        owner = msg.sender;
        balances[owner] = _totalSupply;
    }

    // Implements ERC20Interface
    function totalSupply() constant returns (uint256 supply) {
        supply = _totalSupply;
    }

    // Implements ERC20Interface
    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    // Implements ERC20Interface
    function transfer(address _to, uint256 _amount) returns (bool success) {
        require(balances[_to] + _amount > balances[_to]);
        require(balances[msg.sender] >= _amount);

        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        Transfer(msg.sender, _to, _amount);
        return true;
    }

    // Implements ERC20Interface
    function transferFrom(address _from, address _to, uint256 _amount) returns (bool success) {
        require(balances[_from] >= _amount && allowed[_from][msg.sender] >= _amount && balances[_to] + _amount > balances[_to]);
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _amount && allowance >= _amount);

        balances[_from] -= _amount;
        allowed[_from][msg.sender] -= _amount;
        balances[_to] += _amount;
        Transfer(_from, _to, _amount);
        return true;
    }

    // Implements ERC20Interface
    function approve(address _spender, uint256 _value) returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    // Implements ERC20Interface
    function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }


}