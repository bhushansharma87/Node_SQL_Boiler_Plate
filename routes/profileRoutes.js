const express = require("express");
const profileRouter = express.Router();
const profileController = require("../controller/profileController");
const validateMiddleWare = require("../middleware/validate");
const { verifyToken } = require("../services/token.service");
const upload = require("../services/multer");

// VALIDATIONS
const {
  changePasswordJoiSchema,
  updateProfileJoiSchema,
} = require("../validations/profile.validation");


profileRouter
  .get("", verifyToken, profileController.getUserDetails)
  .put(
    "/change-password",
    verifyToken,
    validateMiddleWare(changePasswordJoiSchema),
    profileController.changePassword
  )
  .put(
    "",
    verifyToken,
    validateMiddleWare(updateProfileJoiSchema),
    profileController.updateDetails
  )
  .put(
    "/profile-image",
    upload.single("profileImage"),
    verifyToken,
    profileController.uploadProfileImage
  );

module.exports = profileRouter;
