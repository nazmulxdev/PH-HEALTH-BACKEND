import status from "http-status";

import { prisma } from "../../lib/prisma";
import { Role, UserStatus } from "../../generated/prisma/enums";
import AppError from "../../shared/AppError";
import {
  IChangeUserRolePayload,
  IChangeUserStatusPayload,
  IRequestUser,
  IUpdateAdminPayload,
} from "./admin.interface";

const getAllAdmins = async () => {
  const admins = await prisma.admin.findMany({
    include: {
      user: true,
    },
  });
  return admins;
};

const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });
  return admin;
};

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
  //TODO: Validate who is updating the admin user. Only super admin can update admin user and only super admin can update super admin user but admin user cannot update super admin user

  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  const { admin } = payload;

  const updatedAdmin = await prisma.admin.update({
    where: {
      id,
    },
    data: {
      ...admin,
    },
  });

  return updatedAdmin;
};

//soft delete admin user by setting isDeleted to true and also delete the user session and account
const deleteAdmin = async (id: string, user: IRequestUser) => {
  //TODO: Validate who is deleting the admin user. Only super admin can delete admin user and only super admin can delete super admin user but admin user cannot delete super admin user
  // validate self delete
  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  if (isAdminExist.id === user.userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.admin.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: isAdminExist.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED, // Optional: you may also want to block the user
      },
    });

    await tx.session.deleteMany({
      where: { userId: isAdminExist.userId },
    });

    await tx.account.deleteMany({
      where: { userId: isAdminExist.userId },
    });

    const admin = await getAdminById(id);

    return admin;
  });

  return result;
};

const changeUserStatus = async (
  user: IRequestUser,
  payload: IChangeUserStatusPayload,
) => {
  /**
   *1. super admin can change the status of any user (admin,doctor,patient). Except himself. He can not change own status
   *
   * 2. Admin can change the status of doctor and patient . Except himself. He can change his own status. He can not change the status of super admin and other admin user
   *
   * */

  const { userId, userStatus } = payload;

  const isAdminExist = await prisma.admin.findUnique({
    where: {
      email: user.email,
    },
    include: {
      user: true,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  const userToChangeStatus = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!userToChangeStatus) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const selfStatusChange = isAdminExist.userId === userId;

  if (selfStatusChange) {
    throw new AppError(status.BAD_REQUEST, "You cannot change your own status");
  }

  if (
    isAdminExist.user.role === Role.ADMIN &&
    userToChangeStatus.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot change the status of super admin. Only super admin can change the status of super admin.",
    );
  }

  if (
    isAdminExist.user.role === Role.ADMIN &&
    userToChangeStatus.role === Role.ADMIN
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot change the status of admin. Only super admin can change the status of admin.",
    );
  }

  if (userStatus === UserStatus.DELETED) {
    throw new AppError(400, "User cannot be deleted");
  }

  const updatedUserStatus = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: userStatus,
    },
  });

  return updatedUserStatus;
};

const changeUserRole = async (
  user: IRequestUser,
  payload: IChangeUserRolePayload,
) => {
  // 1. Super admin can change the role of only other super admin and admin user. He cannot change his own role.

  // 2. Admin cannot change role of any user

  // 3. Role of Patient and Doctor user cannot be changed by anyone. If needed, they have to be deleted and recreated with new role.

  const isSuperAdminExist = await prisma.admin.findUnique({
    where: {
      email: user.email,
    },
    include: {
      user: true,
    },
  });

  const { userId, userRole } = payload;

  const userToChangeRole = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  if (!isSuperAdminExist) {
    throw new AppError(status.NOT_FOUND, "Super Admin not found");
  }

  const selfRoleChange = isSuperAdminExist.userId === userId;

  if (selfRoleChange) {
    throw new AppError(status.BAD_REQUEST, "You cannot change your own role");
  }

  if (
    userToChangeRole.role === Role.DOCTOR ||
    userToChangeRole.role === Role.PATIENT
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "You cannot change the role of doctor or patient",
    );
  }

  const updatedUserRole = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: userRole,
    },
  });

  return updatedUserRole;
};

const deleteUser = async () => {};

export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  changeUserRole,
  changeUserStatus,
  deleteUser,
};
