const HumanStandardToken = artifacts.require('./FixedSupplyToken.sol')

module.exports = (deployer) => {
  deployer.deploy(HumanStandardToken)
}
