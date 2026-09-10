import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  stripeCustomerId: {
    type: String,
  },
  subscriptionTier: {
    type: String,
    enum: ["free", "pro"],
    default: "free",
  },
  stripeSubscriptionId: {
    type: String,
  },
});

/** @param {string} password */
userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};
/** @param {string} password */
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateJWT = function () {
  return jwt.sign({ email: this.email }, /** @type {string} */ (process.env.JWT_SECRET));
};

const User = mongoose.model("User", userSchema);
export default User;
