// utils/otp.utils.js
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateRandomPassword = () => {
  let pass = "";
  let str =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz0123456789@";

  for (let i = 1; i <= 8; i++) {
    let char = Math.floor(Math.random() * str.length + 1);

    pass += str.charAt(char);
  }

  return pass;
};

module.exports = { generateOtp, generateRandomPassword };
