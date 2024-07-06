const {
  developmentChains,
  networkConfig,
} = require("../hepler-hardhat-config");
const { verify } = require("../utils/verify");
const { network, ethers } = require("hardhat");
const {
  storeImages,
  storeTokenUrlMetadata,
} = require("../utils/uploadToPinata");

const imagesLocation = "./images/random";
const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};

  let tokenUris = [
    "ipfs://QmQ1TowkDu1XLkx1RCFjeuPwEBWCVeCKgcNSHTm9ACERzm",
    "ipfs://QmeB8x8FNyi8XxLn9aoRk4icKfE6fQahDHJqcjGSnLkeHu",
    "ipfs://QmZ3bCDzsXrnYaq9ZDvg3iaRtjiM19FxgWCG43p6XY2SpV",
  ];

  const FUND_AMOUNT = "1000000000000000000000";

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;


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
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId,FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  console.log(">>>>>>>>");
  await storeImages(imagesLocation);

  const arguments = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].callBackGasLimit,
    tokenUris,
    networkConfig[chainId].mintFee,
  ];

  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    console.log("verify.....");
    await verify(randomIpfsNft.address, arguments);
  }
  console.log("all done --------");
};

async function handleTokenUris() {
  tokenUris = [];
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );
  for (imageUploadResponseIndex in imageUploadResponses) {
    let tokenUriMetadata = { ...metadataTemplate };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
    tokenUriMetadata.description = `an adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`upload ${tokenUriMetadata.name}.....`);
    const metadataUploadResponse = await storeTokenUrlMetadata(
      tokenUriMetadata
    );
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("token uri uploaded!");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
