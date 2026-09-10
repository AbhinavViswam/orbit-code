import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as billingController from "../controllers/billing.controller.js";

const router = Router();

router.post("/checkout", authMiddleware, billingController.createCheckoutSession);
router.post("/portal", authMiddleware, billingController.createPortalSession);

export default router;
