const {
  developmentChains,
  networkConfig,
} = require("../hepler-hardhat-config");
const { verify } = require("../utils/verify");
const { network, ethers } = require("hardhat");
const { storeImages } = require("../utils/uploadToPinata");

const imsgesLocation = "./images/random";

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let tokenUris;

  if (process.env.UPDATE_FROD_END == "true") {
    tokenUris = await handleTokenUris();
  }

  let vrfCoordinatorV2Address, subscriptionId;
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  console.log(">>>>>>>>");
  await storeImages(imsgesLocation);

  //   const args = [
  //     vrfCoordinatorV2Address,
  //     subscriptionId,
  //     networkConfig[chainId].gasLane,
  //     networkConfig[chainId].callbackGasLimit,
  //     networkConfig[chainId].mintFee,
  //   ];
};

async function handleTokenUris() {
  tokenUris = [];

  return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
