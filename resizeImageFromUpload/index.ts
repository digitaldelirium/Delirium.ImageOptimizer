import { AzureFunction, Context } from "@azure/functions"
import Jimp = require('jimp');
import stream = require('stream');
import getSizeTransform from 'stream-size';

const {
    Aborter,
    BlobURL,
    BlockBlobURL,
    ContainerURL,
    ServiceURL,
    SharedKeyCredential,
    StorageURL,
    uploadStreamToBlockBlob
} = require("@azure/storage-blob");

const ONE_MEGABYTE = 1024 * 1024;
const ONE_MINUTE = 60 * 1000;
const uploadOptions = { bufferSize: 10 * ONE_MEGABYTE, maxBuffers: 20 };

const containerName = process.env.BLOB_CONTAINER_NAME;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accessKey = process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;


const sharedKeyCredential = new SharedKeyCredential(
    accountName,
    accessKey);
const pipeline = StorageURL.newPipeline(sharedKeyCredential);
const serviceURL = new ServiceURL(
    `https://${accountName}.blob.core.windows.net`,
    pipeline
);

const blobTrigger: AzureFunction = async function (context: Context, myInputImage: any): Promise<void> {
    const aborter = Aborter.timeout(30 * ONE_MINUTE);
    const widthInPixels = 1024;
    const contentType = context.bindingData.data.contentType;
    const blobUrl = context.bindingData.data.url;
    const blobName = context.bindingData.slice(blobUrl.lastIndexOf("/")+1)
    //const blobPath = context.bindingData.slice(blob)  // Get Path from root

    const image = await Jimp.read(myInputImage);
    const webImage = image.resize(widthInPixels, Jimp.AUTO);
    const webImageBuffer = await webImage.getBufferAsync(String(Jimp.AUTO));

    const readStream = new stream.PassThrough();
    readStream.end(webImageBuffer);

    const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
    const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, blobName);

    try {
        context.log(`Starting resize for ${blobName}, current size is ${myInputImage.length / ONE_MEGABYTE} MB`)
        await uploadStreamToBlockBlob(aborter,
            readStream,
            blockBlobURL,
            uploadOptions.bufferSize,
            uploadOptions.maxBuffers,
            { blobHTTPHeaders: { blobContentType: "image/*"} });

        context.log(`Resize of ${blobName}.jpg completed! Current size is ${getSizeTransform(readStream) / ONE_MEGABYTE}MB`)
    } catch (e) {
        context.log(e.message);
    }
};

export default blobTrigger;
