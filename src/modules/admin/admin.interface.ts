import { Role } from "../../generated/prisma/enums";

export interface IUpdateAdminPayload {
  admin?: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
  };
}

export interface IRequestUser {
  userId: string;
  role: Role;
  email: string;
}
