const { developmentChains } = require("../hepler-hardhat-config");
const { verify } = require("../utils/verify");
const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const ourToken = await deploy("BasicNft", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(ourToken.address, [INITIAL_SUPPLY]);
  }
};

module.exports.tags = ["all", "basicNft"];
