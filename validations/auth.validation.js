const Joi = require("joi");

const signupJoiSchema = {
  body: Joi.object().keys({
    firstName: Joi.string().max(30).required(),
    lastName: Joi.string().min(1).max(30).allow(null, ""),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(6)
      .max(30)
      .pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w]).*$/)
      .message(
        "Password must include a number, lowercase and uppercase letter, and a special character!"
      )
      .required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Confirm Password must match the password",
      }),
    userType: Joi.string()
      .valid("superAdmin", "admin", "doctor", "patient")
      .optional(),
  }),
};

const loginJoiSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const forgetPasswordJoiSchema = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPasswordSchema = {
  query: Joi.object().keys({
    email: Joi.string().email().required(), // Email in query parameters
  }),
  body: Joi.object().keys({
    otp: Joi.string().required(),
    password: Joi.string()
      .min(6)
      .max(30)
      .pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w]).*$/)
      .message(
        "Password must include a number, lowercase and uppercase letter, and a special character!"
      )
      .required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Confirm Password must match the password",
      }),
  }),
};

const resetPasswordAfterAdminCreatedSchema = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    oldPassword: Joi.string().required(),
    password: Joi.string()
      .min(6)
      .max(30)
      .pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w]).*$/)
      .message(
        "Password must include a number, lowercase and uppercase letter, and a special character!"
      )
      .required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Confirm Password must match the password",
      }),
  }),
};

const verifyEmailOtpSchema = {
  query: Joi.object().keys({
    email: Joi.string().email().required(), // Email in query parameters
  }),
  body: Joi.object().keys({
    otp: Joi.string().required(), // OTP in the request body
  }),
};

const resendOtpSchema = {
  query: Joi.object().keys({
    email: Joi.string().required(),
  }),
};

module.exports = {
  signupJoiSchema,
  loginJoiSchema,
  forgetPasswordJoiSchema,
  resetPasswordSchema,
  resetPasswordAfterAdminCreatedSchema,
  verifyEmailOtpSchema,
  resendOtpSchema,
};
