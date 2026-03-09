import { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "./jwt";
import { config } from "../config/env";
import ms, { StringValue } from "ms";
import { cookieUtils } from "./cookie";
import { Response } from "express";

const getAccessToken = (payload: JwtPayload) => {
  const accessToken = jwtUtils.createToken(
    payload,
    config.ACCESS_TOKEN_SECRET,
    { expiresIn: config.ACCESS_TOKEN_EXPIRES_IN } as SignOptions,
  );

  return accessToken;
};

const getRefreshToken = (payload: JwtPayload) => {
  const refreshToken = jwtUtils.createToken(
    payload,
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN } as SignOptions,
  );

  return refreshToken;
};

const setAccessTokenCookie = (res: Response, token: string) => {
  const maxAge = ms(config.ACCESS_TOKEN_EXPIRES_IN as StringValue) / 1000;
  cookieUtils.setCookie(res, "accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: Number(maxAge),
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  const maxAge = ms(config.REFRESH_TOKEN_EXPIRES_IN as StringValue) / 1000;
  cookieUtils.setCookie(res, "refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: Number(maxAge),
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  const maxAge =
    ms(config.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN as StringValue) / 1000;
  cookieUtils.setCookie(res, "better-auth.session_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: Number(maxAge),
  });
};

export const jwtTokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
};
