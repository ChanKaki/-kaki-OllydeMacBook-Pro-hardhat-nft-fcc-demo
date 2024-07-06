const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");

require("dotenv").config();
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  let responses = [];
  console.log("upload.........");
  for (fileIndex in files) {
    const fileName = `${fullImagesPath}/${files[fileIndex]}`;
    const options = {
      pinataMetadata: {
        name: files[fileIndex],
      },
    };
    const readableStreamForFile = fs.createReadStream(fileName);
    try {
      const response = await pinata.pinFileToIPFS(
        readableStreamForFile,
        options
      );
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = { storeImages };
