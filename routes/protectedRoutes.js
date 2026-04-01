import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
    res.json({
        message: "Authorized user",
        user: req.user,
    });
});

router.get("/admin-only", protect, authorizeRoles("admin"), (req, res) => {
    res.json({
        message: "Welcome Admin",
        role: req.user.role,
    });
});

router.get("/doctor-only", protect, authorizeRoles("doctor"), (req, res) => {
    res.json({
        message: "Welcome Doctor",
        role: req.user.role,
    });
});

router.get("/nurse-only", protect, authorizeRoles("nurse"), (req, res) => {
    res.json({
        message: "Welcome Nurse",
        role: req.user.role,
    });
});

export default router;