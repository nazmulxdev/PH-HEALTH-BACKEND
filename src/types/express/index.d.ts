import { Role, UserStatus } from "../../generated/prisma/enums";

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  isDeleted: boolean;
  emailVerified: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
