const messages = require("../utils/message.utils");
const statusCodes = require("../utils/status.code");
const { hashPassword, comparePassword } = require("../services/hashPassword");
const { generateToken } = require("../services/token.service");
const { generateOtp } = require("../utils/generateOtp&Password");
const {
  forgotPasswordOtpVerifyMail,
  verifyEmailAfterSignup,
} = require("../services/sendMail");
const { sequelize } = require("../config/database");

// MODEL
const { User } =
  require("../config/database").db;

// API FOR SIGNUP DOCTOR
const signupUser = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start a transaction

  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      await transaction.rollback(); // Rollback transaction if user exists
      return res.status(statusCodes.CONFLICT).json({
        status: statusCodes.CONFLICT,
        message: messages.USER_ALREADY_EXISTS,
      });
    }

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.PASSWORD_NOT_MATCHED,
      });
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(password); // Hash the password

    // Create the user object and automatically generate fullName
    const fullName = `${firstName} ${lastName}`; // Concatenate first and last name

    // Create the user object
    const newUser = {
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      fullName: fullName.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false, // Set to false until the doctor verifies with OTP
    };

    // Save the user to the database
    const savedUser = await User.create(newUser, { transaction });
    // Generate OTP
    const otp = generateOtp();

    // Update the OTP and expiration time in the User model
    savedUser.otp = otp;
    savedUser.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
    await savedUser.save({ transaction });

    // Define the reset password URL for new staff
    const verifyEmailUrl = `${process.env.FRONTEND_URL}/auth/verify-otp?email=${email}`;

    // Send OTP via email
    try {
      await verifyEmailAfterSignup({
        email: savedUser?.email,
        subject: "Verify Your Email",
        text: `Your OTP for verification is: ${otp}`,
        verificationOTP: otp,
        link: verifyEmailUrl,
      });
    } catch (error) {
      // Rollback the transaction if email sending fails
      await transaction.rollback();
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: "Email template not found",
        error: error.message, // Include the error message for debugging
      });
    }

    // Commit the transaction if all steps are successful
    await transaction.commit();

    // Fetch the user details based on email
    const user = await User.findOne({
      where: { email: savedUser?.email },
      attributes: { exclude: ["otp", "otpExpiresAt"] },
    });

    return res.status(statusCodes.CREATED).json({
      status: statusCodes.CREATED,
      message: messages.USER_CREATED_SUCCESSFULLY,
      data: user,
    });
  } catch (error) {
    // Rollback transaction in case of any error
    if (transaction) await transaction.rollback();
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

// API TO VERIFY OTP AFTER SIGNUP
const verifyEmailOtp = async (req, res) => {
  try {
    const { email } = req.query;
    const { otp } = req.body;

    // Check if all required fields are provided
    if (!otp) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.MISSING_FIELDS,
      });
    }

    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Check if the OTP matches
    if (user.otp !== otp) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: messages.INVALID_OTP,
      });
    }

    // Check if the OTP is expired
    const currentTime = new Date();
    if (user.otpExpiresAt < currentTime) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: messages.EXPIRED_OTP,
      });
    }

    // If OTP is valid and not expired, you can mark the user as verified
    user.isVerified = true; // Or any other logic for marking verification
    await user.save(); // Save changes to the user

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.OTP_VERIFIED_SUCCESSFULLY,
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

// API TO RESEND OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.query;

    // Check if email is provided
    if (!email) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.MISSING_FIELDS,
      });
    }

    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Generate a new OTP using the utility function
    const otp = generateOtp();

    // Update the OTP and expiration time
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Save the updated user information
    await user.save();

    // Resend OTP via email
    await verifyEmailAfterSignup({
      email: user?.email,
      subject: "Resend OTP for Verification",
      text: `Your OTP for verification is: ${otp}`,
      verificationOTP: otp,
    });

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.OTP_RESENT_SUCCESSFULLY,
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

// API FOR LOGIN DOCTOR
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch the user from the database
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await comparePassword(password, user.password); // Assumes `comparePassword` is a utility function

    if (!isPasswordValid) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: messages.INVALID_CREDENTIALS,
      });
    }

    const role = user?.userType;

    // Generate JWT token
    const token = generateToken({
      userId: user?.id,
      email: user?.email,
      role: user?.userType,
    });

    // Send the response
    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.LOGIN_SUCCESSFUL,
      data: { role, token },
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

// API FOR FORGET PASSWORD AND SEND OTP
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Generate OTP
    const otp = generateOtp();

    // Update the OTP and expiration time in the User model
    user.otp = otp;
    // user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // OTP valid for 15 minutes
    // user.otpExpiresAt = new Date(Date.now() + 10 * 1000); // OTP valid for 10 seconds
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    await user.save();

    // Send OTP via email
    await forgotPasswordOtpVerifyMail({
      email: user.email,
      subject: "Password Reset OTP",
      text: `Please use the following OTP to reset your password: ${otp}`,
      verificationOTP: otp,
    });

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.OTP_SENT_SUCCESSFULLY,
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

// API FOR VERIFY OTP AND RESET PASSWORD
const verifyOtpAndResetPassword = async (req, res) => {
  try {
    const { email } = req.query;
    const { otp, password, confirmPassword } = req.body;

    // Check if all required fields are provided
    if (!otp || !password || !confirmPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.MISSING_FIELDS,
      });
    }

    // Check if the new password and confirm password match
    if (password !== confirmPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.PASSWORD_NOT_MATCHED,
      });
    }

    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Check if the OTP matches
    if (user.otp !== otp) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: messages.INVALID_OTP,
      });
    }

    // Check if the OTP is expired
    const currentTime = new Date();
    if (user.otpExpiresAt < currentTime) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: messages.EXPIRED_OTP,
      });
    }

    // If OTP is valid and not expired, hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password in the database
    await User.update(
      { password: hashedPassword, otp: null, otpExpiresAt: null }, // Optionally reset OTP fields
      { where: { email } }
    );

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.PASSWORD_RESET_SUCCESSFUL,
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

// API FOR RESET PASSWORD AFTER CREATED BY ADMIN
const resetPasswordAfterAdminCreated = async (req, res) => {
  try {
    const { email, oldPassword } = req.query;
    const { password, confirmPassword } = req.body;

    // Validate input
    if (!password || !confirmPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.PASSWORDS_REQUIRED,
      });
    }

    // Ensure new password and confirm password match
    if (password !== confirmPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.PASSWORD_NOT_MATCHED,
      });
    }

    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Verify old password
    const isMatch = await comparePassword(oldPassword, user.password);

    if (!isMatch) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: messages.INVALID_OLD_PASSWORD,
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password in the database
    await User.update(
      { password: hashedPassword, isVerified: true },
      { where: { email } }
    );

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.PASSWORD_RESET_SUCCESS,
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

module.exports = {
  signupUser,
  verifyEmailOtp,
  resendOtp,
  loginUser,
  forgetPassword,
  verifyOtpAndResetPassword,
  resetPasswordAfterAdminCreated,
};
