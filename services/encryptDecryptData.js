const cipher = (salt) => {
  const textToChars = (text) => text?.split("").map((c) => c?.charCodeAt(0));
  const byteHex = (n) => ("0" + Number(n)?.toString(16)).slice(-2);
  const applySaltToChar = (code) =>
    textToChars(salt)?.reduce((a, b) => a ^ b, code);
  return (text) =>
    text
      ?.split("")
      ?.map(textToChars)
      ?.map(applySaltToChar)
      ?.map(byteHex)
      ?.join("");
};
const decipher = (salt) => {
  const textToChars = (text) => text?.split("")?.map((c) => c?.charCodeAt(0));
  const applySaltToChar = (code) =>
    textToChars(salt).reduce((a, b) => a ^ b, code);
  return (encoded) =>
    encoded
      ?.match(/.{1,2}/g)
      ?.map((hex) => parseInt(hex, 16))
      ?.map(applySaltToChar)
      ?.map((charCode) => String.fromCharCode(charCode))
      ?.join("");
};
// To create a cipher
const encrypt = cipher("rqXL3cXOOpKlUeZ7dSP8QBuvbMHPVBxG");
const decrypt = decipher("rqXL3cXOOpKlUeZ7dSP8QBuvbMHPVBxG");

//Encrypt data
const encryptData = (data) => {
  return encrypt(data);
  return data;
};

//Decrypt Data
const decryptData = (data) => {
  return decrypt(data);
  return data;
};

module.exports = { decryptData, encryptData };
