import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import userRoute from "./routes/user.route.js";
import projectRoute from "./routes/project.route.js";
import aiRoute from "./routes/ai.route.js";
import billingRoute from "./routes/billing.routes.js";
import * as billingController from "./controllers/billing.controller.js";

const app = express();

// Stripe webhook must come BEFORE express.json() because it needs the raw body
app.post("/billing/webhook", express.raw({ type: "application/json" }), billingController.handleWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND || "http://localhost:3000",
    credentials: true,
  })
);

app.use("/users", userRoute);
app.use("/project", projectRoute);
app.use("/ai", aiRoute);
app.use("/billing", billingRoute);

export default app;
