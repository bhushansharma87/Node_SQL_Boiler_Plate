const Joi = require("joi");

const changePasswordJoiSchema = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(6)
      .max(30)
      .pattern(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w]).*$/)
      .message(
        "Password must include a number, lowercase and uppercase letter, and a special character!"
      ),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword")) // Must match the newPassword
      .required(),
  }),
};

const updateProfileJoiSchema = {
  body: Joi.object().keys({
    firstName: Joi.string().max(30).required(),
    lastName: Joi.string().min(1).max(30).optional().allow(null, ""),
    email: Joi.string().email().optional(),
    gender: Joi.string()
      .valid("male", "female", "other")
      .trim()
      .allow(null, "")
      .optional(),
    phoneNumber: Joi.string().min(8).required(),
    dob: Joi.string().optional(),
  }),
};

module.exports = {
  changePasswordJoiSchema,
  updateProfileJoiSchema,
};
