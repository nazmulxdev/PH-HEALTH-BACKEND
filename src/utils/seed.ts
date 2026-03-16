import { Role } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";

import { config } from "../config/env";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.SUPER_ADMIN,
      },
    });

    if (isSuperAdminExist) {
      console.log("Super admin exist. Skipping seeding super admin.");
      return;
    }

    const superAdminUser = await auth.api.signUpEmail({
      body: {
        email: config.SUPER_ADMIN_EMAIL,
        password: config.SUPER_ADMIN_PASSWORD,
        name: "Super Admin",
        role: Role.SUPER_ADMIN,
        needPasswordChange: false,
        rememberMe: false,
      },
    });

    await prisma.$transaction(async (txx) => {
      await txx.user.update({
        where: {
          id: superAdminUser.user.id,
        },
        data: {
          emailVerified: true,
        },
      });
      await txx.admin.create({
        data: {
          userId: superAdminUser.user.id,
          name: "Super Admin",
          email: superAdminUser.user.email,
        },
      });
    });

    const superAdmin = await prisma.admin.findUniqueOrThrow({
      where: {
        email: config.SUPER_ADMIN_EMAIL,
      },
      include: {
        user: true,
      },
    });

    console.log("Super admin created,", superAdmin);
  } catch (error) {
    console.error("Error seeding super admin: ", error);

    await prisma.user.delete({
      where: {
        email: config.SUPER_ADMIN_EMAIL,
      },
    });
  }
};
