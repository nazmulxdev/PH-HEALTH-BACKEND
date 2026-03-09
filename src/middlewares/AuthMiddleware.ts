// export default AuthMiddleWare = () => {};

import { NextFunction, Request, Response } from "express";
import { Role, UserStatus } from "../generated/prisma/enums";
import catchAsync from "../shared/catchAsync";
import { cookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";
import AppError from "../shared/AppError";
import status from "http-status";
import { prisma } from "../lib/prisma";
import { AuthUser } from "../types/express";

const authMiddleware = (...roles: Array<Role>) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const betterAuthSessionToken = cookieUtils.getCookie(
      req,
      "better-auth.session_token",
    );

    if (!betterAuthSessionToken) {
      throw new AppError(
        status.UNAUTHORIZED,
        "Unauthorized access! No better auth session token provided.",
        "NO_BETTER_AUTH_SESSION_TOKEN_PROVIDED",
        [
          {
            field: "Authentication",
            message: "No better auth session token provided",
          },
        ],
      );
    }

    if (!betterAuthSessionToken) {
      const sessionExist = await prisma.session.findFirst({
        where: {
          token: betterAuthSessionToken,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (sessionExist && sessionExist.user) {
        const user = sessionExist.user;
        const now = new Date();

        const expiresAt = new Date(sessionExist.expiresAt);
        const createdAt = new Date(sessionExist.createdAt);

        const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();

        const timeRemaining = expiresAt.getTime() - now.getTime();

        const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

        if (percentRemaining < 10) {
          res.setHeader("X-Session-Refresh", "true");

          res.setHeader("X-Session-Expires-At", expiresAt.toISOString());

          res.setHeader("X-Session-Time-Remaining", timeRemaining.toString());

          console.log("Session will be expire soon");
        }

        if (
          user.status === UserStatus.BLOCKED ||
          user.status === UserStatus.DELETED
        ) {
          throw new AppError(
            status.UNAUTHORIZED,
            "Unauthorized access! User not active",
            "USER_NOT_ACTIVE",
            [
              {
                field: "Authentication",
                message: "User not active",
              },
            ],
          );
        }

        if (user.isDeleted) {
          throw new AppError(
            status.UNAUTHORIZED,
            "Unauthorized access! User deleted",
            "USER_DELETED",
            [
              {
                field: "Authentication",
                message: "User deleted",
              },
            ],
          );
        }

        if (roles.length && !roles.includes(user.role)) {
          throw new AppError(
            status.UNAUTHORIZED,
            `Only ${roles} can able to access this route.`,
            "UNAUTHORIZED_ACCESS",
            [
              {
                field: "Authentication",
                message: `Only ${roles} can able to access this route.`,
              },
            ],
          );
        }
      }
    }

    const accessToken = cookieUtils.getCookie(req, "accessToken");

    if (!accessToken) {
      throw new AppError(
        status.UNAUTHORIZED,
        "Unauthorized access! No access token provided.",
        "NO_ACCESS_TOKEN_PROVIDED",
        [
          {
            field: "Authentication",
            message: "No access token provided",
          },
        ],
      );
    }

    const verifyAccessToken = jwtUtils.verifyToken(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string,
    );

    if (!verifyAccessToken.success || !verifyAccessToken.decoded) {
      throw new AppError(
        status.UNAUTHORIZED,
        "Unauthorized access! Invalid access token.",
        "INVALID_ACCESS_TOKEN",
        [
          {
            field: "Authentication",
            message: "Invalid access token",
          },
        ],
      );
    }

    if (roles.length && !roles.includes(verifyAccessToken.decoded!.role)) {
      throw new AppError(
        status.UNAUTHORIZED,
        `Only ${roles} can able to access this route.`,
        "UNAUTHORIZED_ACCESS",
        [
          {
            field: "Authentication",
            message: `Only ${roles} can able to access this route.`,
          },
        ],
      );
    }

    req.user = verifyAccessToken.decoded as AuthUser;

    next();
  });
};

export default authMiddleware;
