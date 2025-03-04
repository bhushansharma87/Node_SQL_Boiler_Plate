const messages = require("../utils/message.utils");
const statusCodes = require("../utils/status.code");
const { comparePassword } = require("../services/hashPassword");
const { uploadToS3, getSignedUrl, deleteFromS3 } = require("../utils/s3");
const { generateUniqueName } = require("../utils/others");

// MODELS
const { User, Doctor,  } = require("../config/database").db;

// API FOR PROFILE DETAILS
const getUserDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    // Fetch the user by userId from the database
    const user = await User.findOne({
      where: { id:userId }, // Match the user by the provided userId
      attributes: {
        exclude: ["password", "otp", "otpExpiresAt"], // Exclude sensitive fields
      },
    });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Handle profile image with signed URL if applicable
    const profileImage = user.profileImage
      ? await getSignedUrl(user.profileImage) // Secure URL generation for profile image
      : null;

    // Combine the user data with the profile image
    const userData = {
      ...user.toJSON(), // Convert Sequelize object to plain JSON
      profileImage,
    };

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.DETAILS_FETCHED,
      data: userData,
    });
  } catch (error) {
    console.error("Error in getUserDetails API:", error);
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

// API FOR CHANGED PASSWORD
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Find the user
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    // Compare the provided old password with the stored hashed password
    const isOldPasswordValid = await comparePassword(
      oldPassword,
      user.password
    );

    if (!isOldPasswordValid) {
      return res.status(statusCodes.UNAUTHORIZED).json({
        status: statusCodes.UNAUTHORIZED,
        message: messages.INVALID_OLD_PASSWORD,
      });
    }

    // Check if newPassword and oldPassword are the same
    const isSameAsOldPassword = await comparePassword(
      newPassword,
      user.password
    );
    if (isSameAsOldPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.NEW_PASSWORD_SAME_AS_OLD,
      });
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.PASSWORD_NOT_MATCH,
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.PASSWORD_UPDATED_SUCCESSFULLY,
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

// API FOR UPDATE PROFILE DETAILS
const updateDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const updateData = req.body;

    // Validate ID
    if (!id) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.INVALID_OR_MISSING_ID,
      });
    }

    // Find the user by ID
    const user = await User.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }

    if (!updateData?.gender) updateData.gender = null;

    // Set fullName based on firstName and lastName
    if (updateData.firstName || updateData.lastName) {
      const firstName = updateData.firstName || user.firstName;
      const lastName = updateData.lastName || user.lastName;
      updateData.fullName = `${firstName} ${lastName}`.trim();
    }

    // Update the user with new data
    await User.update(updateData, {
      where: { id },
    });

    // Fetch the updated user document
    const updatedUser = await User.findOne({
      where: { id },
      attributes: { exclude: ["otp", "otpExpiresAt"] },
      include: [
        {
          model: Doctor,
          attributes: {
            exclude: [
              "userId",
              "status",
              "createdAt",
              "updatedAt",
              "deletedAt",
            ],
          },
        },
      ],
    });

    // Manually merge the doctor data into the user object
    let responseData = {
      ...updatedUser.toJSON(),
    };

    if (updatedUser.Doctor) {
      responseData = {
        ...responseData,
        ...updatedUser.Doctor.toJSON(),
      };
      delete responseData.Doctor; // Remove the nested doctor object after merging
    }

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.PROFILE_UPDATED_SUCCESSFULLY,
      data: responseData,
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

// API FOR UPDATE PROFILE IMAGE
const uploadProfileImage = async (req, res) => {
  try {
    const id = req.user.id;
    const updateData = req.body;

    // Validate ID
    if (!id) {
      return res.status(statusCodes.BAD_REQUEST).json({
        status: statusCodes.BAD_REQUEST,
        message: messages.INVALID_OR_MISSING_ID,
      });
    }

    // Find the user by ID
    const user = await User.findOne({
      where: { id },
      attributes: ["profileImage"],
    });

    if (!user) {
      return res.status(statusCodes.NOT_FOUND).json({
        status: statusCodes.NOT_FOUND,
        message: messages.USER_NOT_FOUND,
      });
    }
    let fileKeyName;
    // Handle profile image file upload
    if (req.file) {
      let file = req.file;
      file.keyName = generateUniqueName(file.originalname);
      fileKeyName = await uploadToS3(file);

      // After successful upload, delete the old profile image from S3 if it exists
      if (user.profileImage) {
        await deleteFromS3(user.profileImage); // Function to delete the old image from S3
      }
    }

    // Update the user with new data
    await User.update(
      { profileImage: fileKeyName },
      {
        where: { id },
      }
    );

    const profileImage = user.profileImage
      ? await getSignedUrl(user.profileImage)
      : null;

    return res.status(statusCodes.OK).json({
      status: statusCodes.OK,
      message: messages.PROFILE_UPDATED_SUCCESSFULLY,
      data: { profileImage },
    });
  } catch (error) {
    return res.status(statusCodes.ERROR).json({
      status: statusCodes.ERROR,
      message: messages.INTERNAL_SERVER_ERROR,
    });
  }
};

module.exports = {
  getUserDetails,
  changePassword,
  uploadProfileImage,
  updateDetails,
};
