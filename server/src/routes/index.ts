import { Router } from "express";
import urlRoutes from "./urlRoutes";
import redirectRoutes from "./redirectRoutes";

const router = Router();

// API routes
router.use("/api", urlRoutes);

// Redirect routes (must be last to avoid conflicts)
router.use("/", redirectRoutes);

export default router;
