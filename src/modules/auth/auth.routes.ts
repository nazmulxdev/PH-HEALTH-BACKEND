import { Router } from "express";
import { authController } from "./auth.controller";
import authMiddleware from "../../middlewares/AuthMiddleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();

router.post("/register", authController.registerPatient);

router.post("/signin", authController.signinPatient);

router.get(
  "/me",
  authMiddleware(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  authController.getMe,
);

// new token by refresh token

router.post("/refresh-token", authController.getNewToken);

// change password

router.post(
  "/change-password",
  authMiddleware(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  authController.changePassword,
);

// logout user

router.post(
  "/logout",
  authMiddleware(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  authController.logOutUser,
);

// verify email
router.post("/verify-email", authController.verifyEmail);

// forgot password

router.post("/forgot-password", authController.forgetPassword);

// reset password

router.post("/reset-password", authController.resetPassword);

router.get("/login/google", authController.googleLogin);

router.get("/google/success", authController.googleLoginSuccess);

router.get("/oauth/error", authController.handleOAuthError);

export const authRoutes = router;
