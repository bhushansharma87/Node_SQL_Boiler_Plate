const bcrypt = require("bcrypt");

// Hashing function
async function hashPassword(password) {
  const saltRounds = Number(process.env.SALT_ROUNDS);
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error("Error hashing password");
  }
}

// Function to compare passwords
async function comparePassword(plainPassword, hashedPassword) {
  try {
    const match = await bcrypt.compare(plainPassword, hashedPassword);
    return match;
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
}

module.exports = { hashPassword, comparePassword };
