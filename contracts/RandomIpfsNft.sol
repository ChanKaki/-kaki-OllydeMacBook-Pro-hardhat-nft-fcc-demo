// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft_RangeOutOfBounds();
error RandomIpfsNft_NeedMoreETHSent();
error RandomIpfsNft_TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  enum Breed {
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }

      VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLand;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMAIONS = 3;
  uint32 private constant NUM_WORDS = 1;
  mapping(uint256 => address) public s_requsetSender;
  uint256 public s_tokenCounter;
  uint256 internal constant MAX_CHANCE_VALUE = 100;
  string[] internal s_dogTokenUris;
  uint256 immutable i_mintFee;

  event NftRequested(uint256 indexed requestId, address requester);
  event NftMinted(Breed breed, address minter);

  constructor(
    address vrfCoordinatorV2,
    uint64 subscriptionId,
    bytes32 gasLand,
    uint32 callbackGasLimit,
    string[3] memory dogTokenUris,
    uint256 mintFee
  ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_subscriptionId = subscriptionId;
    i_gasLand = gasLand;
    i_callbackGasLimit = callbackGasLimit;
    s_dogTokenUris = dogTokenUris;
    i_mintFee = mintFee;
  }

  function requestNft() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert RandomIpfsNft_NeedMoreETHSent();
    }
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLand,
      i_subscriptionId,
      REQUEST_CONFIRMAIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requsetSender[requestId] = msg.sender;
    emit NftRequested(requestId, msg.sender);
  }

  function withDraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool sucess, ) = payable(msg.sender).call{ value: amount }("");
    if (!sucess) {
      revert RandomIpfsNft_TransferFailed();
    }
  }

  function getBreedFromModdedRng(
    uint256 moddedRng
  ) public pure returns (Breed) {
    uint256 cumulativeSum = 0;
    uint256[3] memory changceArray = getChanceArray();
    for (uint256 i = 0; i < changceArray.length; i++) {
      if (
        moddedRng >= cumulativeSum &&
        moddedRng < cumulativeSum + changceArray[i]
      ) {
        return Breed(i);
      }
      cumulativeSum += changceArray[i];
    }
    revert RandomIpfsNft_RangeOutOfBounds();
  }

  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 30, MAX_CHANCE_VALUE];
  }

  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
  ) internal override {
    address dogOwner = s_requsetSender[requestId];
    uint256 newTokenId = s_tokenCounter;
    uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
    Breed dogBreed = getBreedFromModdedRng(moddedRng);
    s_tokenCounter +=s_tokenCounter;
    _safeMint(dogOwner, newTokenId);
    _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
    emit NftMinted(dogBreed, dogOwner);
  }

  function getMinFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getDogTokeUris(uint256 index) public view returns (string memory) {
    return s_dogTokenUris[index];
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }
}
