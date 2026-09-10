import { generateResult } from "../middleware/ai.middleware.js";

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 */
export const getResult = async (req, res) => {
  const { prompt } = req.query;
  const result = await generateResult(/** @type {string} */ (prompt));
  res.send(result);
};
