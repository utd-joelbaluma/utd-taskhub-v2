import express from "express";
import { acceptInvitation } from "../controllers/invitation.controller.js";

const router = express.Router();

// Public — no auth required. Token is the credential.
router.post("/accept", acceptInvitation);

export default router;
