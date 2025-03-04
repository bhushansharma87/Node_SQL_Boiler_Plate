const express = require("express");
const authRouter = express.Router();
const authController = require("../controller/authController");
const validateMiddleWare = require("../middleware/validate");
const { signupJoiSchema, loginJoiSchema, resendOtpSchema, verifyEmailOtpSchema, resetPasswordAfterAdminCreatedSchema, resetPasswordSchema, forgetPasswordJoiSchema } = require("../validations/auth.validation");

authRouter
  .post(
    "/signup",
    validateMiddleWare(signupJoiSchema),
    authController.signupUser
  )
  .post("/login", validateMiddleWare(loginJoiSchema), authController.loginUser)
  .post("/forget-password", validateMiddleWare(forgetPasswordJoiSchema), authController.forgetPassword)
  .post(
    "/reset-password",
    validateMiddleWare(resetPasswordSchema),
    authController.verifyOtpAndResetPassword
  )
  .post(
    "/new-password",
    validateMiddleWare(resetPasswordAfterAdminCreatedSchema),
    authController.resetPasswordAfterAdminCreated
  )
  .post(
    "/verify-email-otp",
    validateMiddleWare(verifyEmailOtpSchema),
    authController.verifyEmailOtp
  )
  .post(
    "/resend-otp",
    validateMiddleWare(resendOtpSchema),
    authController.resendOtp
  );

module.exports = authRouter;