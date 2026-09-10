import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const createUserController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ e: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ e: "User already exists" });
    }
    const hashedPassword = await /** @type {any} */ (User).hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    const token = jwt.sign(
      { id: user._id, email: user.email },
      /** @type {string} */ (process.env.JWT_SECRET),
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path:"/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      m: "User registered successfully",
      o: {
        _id: user._id,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Error in createUserController:", err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ e: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ e: "User not found" });
    }
    const isValid = await /** @type {any} */ (user).isValidPassword(password);
    if (!isValid) {
      return res.status(400).json({ e: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      /** @type {string} */ (process.env.JWT_SECRET),
      { expiresIn: "7d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path:"/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    const userData = /** @type {any} */ (user).toObject();
    delete userData.password;
    return res.status(200).json({
      m: "User logged in successfully",
      o: userData,
      token,
    });
  } catch (err) {
    console.error("Error in userLogin:", err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const userProfile = async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("-password");
  try {
    return res.status(200).json({ m: "User profile", o: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const userLogout = async (req, res) => {
  try {
    res.cookie("token", "");
    return res.status(200).json({ m: "User logged out" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ e: "Internal server error" });
  }
};

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const authCheck = async (req, res) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(" ")[1] : null);
    if (!token) {
      return res.status(401).json({ e: "Token required" });
    }
    const user = jwt.verify(token, /** @type {string} */ (process.env.JWT_SECRET));
    if (user) {
      return res.status(200).json({ m: "success", o: true });
    }
    return res.status(401).json({ m: "Invalid", o: false });
  } catch (error) {
    return res.status(401).json({ e: "Invalid token", o: false });
  }
};
