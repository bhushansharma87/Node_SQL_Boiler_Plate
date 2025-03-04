const path = require("path");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = async (file) => {
  //console.log(`Uploading`, file);
  try {
    if (!file || !file.originalname) {
      throw new Error("File is undefined or has no originalname property.");
    }

    // const ext = path.extname(file.originalname.toString());
    let keyName;
    switch (file.fieldname) {
      case "profileImage":
        keyName = `uploads/profileImage/${file.keyName}`;
        break;
      case "medicalDocuments":
        keyName = `uploads/patientReferralMedicalDocument/${file.keyName}`;
        break;
      case "consultNoteDocuments":
        keyName = `uploads/consultNoteDocuments/${file.keyName}`;
        break;
      default:
        break;
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: keyName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const data = await s3.upload(params).promise();
    //console.log("File uploaded successfully. Location:", data.Location);
    return keyName;
  } catch (error) {
    console.error("Error uploading file:", JSON.stringify(error, null, 2));
    throw error;
  }
};

const getSignedUrl = async (key, expiryInMinutes = 15) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Expires: 60 * expiryInMinutes, // URL expires in 15 minutes (adjust as needed)
    };

    const signedUrl = s3.getSignedUrl("getObject", params);
    //console.log("Generated signed URL:", key, signedUrl);
    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw error;
  }
};

const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    // console.log("File deleted successfully from S3:", key);
  } catch (error) {
    console.error(
      "Error deleting file from S3:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
};

module.exports = {
  uploadToS3,
  getSignedUrl,
  deleteFromS3,
};
