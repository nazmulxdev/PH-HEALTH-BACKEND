import { Router } from "express";

import { updateAdminZodSchema } from "./admin.validation";
import { Role } from "../../generated/prisma/enums";
import authMiddleware from "../../middlewares/AuthMiddleware";
import { AdminController } from "./admin.controller";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router.get(
  "/",
  authMiddleware(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAllAdmins,
);
router.get(
  "/:id",
  authMiddleware(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAdminById,
);
router.patch(
  "/:id",
  authMiddleware(Role.SUPER_ADMIN),
  validateRequest({ body: updateAdminZodSchema }),
  AdminController.updateAdmin,
);
router.delete(
  "/:id",
  authMiddleware(Role.SUPER_ADMIN),
  AdminController.deleteAdmin,
);

router.patch(
  "/:id/status",
  authMiddleware(Role.SUPER_ADMIN),
  AdminController.changeUserStatus,
);

router.patch(
  "/:id/role",
  authMiddleware(Role.SUPER_ADMIN),
  AdminController.changeUserRole,
);

// if needed then we will use or refactor this
router.delete(
  "/:id/user-delete",
  authMiddleware(Role.SUPER_ADMIN),
  AdminController.deleteUser,
);

export const AdminRoutes = router;
