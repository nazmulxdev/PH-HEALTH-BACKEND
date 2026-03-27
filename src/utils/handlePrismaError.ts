// import status from "http-status";
// import { Prisma } from "../generated/prisma/client";
// import AppErrorResponse from '../shared/AppErrorResponse';

// const getStatusCodeFromPrismaError = (errorCode: string) => {
//   // P2002 : Unique constrain failed

//   if (errorCode === "P2002") {
//     return status.CONFLICT;
//   }

//   //   P2025, P2001, P2015, P2018: not found errors

//   if (["P2025", "P2001", "P2015", "P2018"].includes(errorCode)) {
//     return status.NOT_FOUND;
//   }

//   // P1000, P6002 : db Authentication error

//   if (["P1000", "P6002"].includes(errorCode)) {
//     return status.UNAUTHORIZED;
//   }

//   // P1010, P6010 : Access denied error = 403 forbidden

//   if (["P1010", "P6010"].includes(errorCode)) {
//     return status.FORBIDDEN;
//   }

//   // P6003: prisma accelerate plan limit exceeded = 402 payment required

//   if (["P6003"].includes(errorCode)) {
//     return status.PAYMENT_REQUIRED;
//   }

//   // P1008, 2004,6004 :Time ut errors = 504 gateway timeout

//   if (["P1008", "2004", "6004"].includes(errorCode)) {
//     return status.GATEWAY_TIMEOUT;
//   }

//   //   P5011: rate limit exceeded = 429 Too many request

//   if (["P5011"].includes(errorCode)) {
//     return status.TOO_MANY_REQUESTS;
//   }

//   // P6009 Response size limit exceeded = 413 payload too large

//   if (["P6009"].includes(errorCode)) {
//     return 413;
//   }

//   //   p1xxx, p2024, p2037, p6008 : connection errors

//   if (
//     errorCode.startsWith("P1") ||
//     ["P2024", "P2037", "P6008"].includes(errorCode)
//   ) {
//     return status.SERVICE_UNAVAILABLE;
//   }

//   // p2xxx : except unhandled errors , Bad request

//   if (errorCode.startsWith("P2")) {
//     return status.BAD_REQUEST;
//   }

//   // p3xxx, p4xxx

//   if (errorCode.startsWith("P3") || errorCode.startsWith("P4")) {
//     return status.UNPROCESSABLE_ENTITY;
//   }

//   return status.INTERNAL_SERVER_ERROR;
// };

// const formateErrorMeta = (
//   meta?: Record<string, unknown> | undefined,
// ): string => {
//   if (!meta) return "";

//   const parts: string[] = [];

//   if (meta.target) {
//     parts.push(`Field(s):${String(meta.target)}`);
//   }

//   if (meta.field_name) {
//     parts.push(`Field: ${String(meta.field_name)}`);
//   }

//   if (meta.column) {
//     parts.push(`Column: ${String(meta.column)}`);
//   }

//   if (meta.table) {
//     parts.push(`Table: ${String(meta.table)}`);
//   }

//   if (meta.model_name) {
//     parts.push(`Model: ${String(meta.model)}`);
//   }

//   if (meta.relation_name) {
//     parts.push(`Relation: ${String(meta.relation_name)}`);
//   }

//   if (meta.field_path) {
//     parts.push(`Field Path: ${String(meta.field_path)}`);
//   }

//   if (meta.constrain) {
//     parts.push(`Constraint: ${String(meta.constrain)}`);
//   }

//   if (meta.data_type) {
//     parts.push(`Data Type: ${String(meta.data_type)}`);
//   }

//   if (meta.database_error) {
//     parts.push(`Database Error: ${String(meta.database_error)}`);
//   }

//   if (meta.database_path) {
//     parts.push(`Database Path: ${String(meta.database_path)}`);
//   }

//   if (meta.duration) {
//     parts.push(`Duration: ${String(meta.duration)}`);
//   }

//   if (meta.argument) {
//     parts.push(`Argument: ${String(meta.argument)}`);
//   }

//   if (meta.code) {
//     parts.push(`Code: ${String(meta.code)}`);
//   }

//   if (meta.name) {
//     parts.push(`Name: ${String(meta.name)}`);
//   }

//   if (meta.value) {
//     parts.push(`Value: ${String(meta.value)}`);
//   }

//   if (meta.cause) {
//     parts.push(`Cause: ${String(meta.cause)}`);
//   }

//   return parts.length > 0 ? parts.join(" | ") : "";
// };

// export const handlePrismaClientKnownRequestError = (
//   error: Prisma.PrismaClientKnownRequestError,
// ):AppErrorResponse => {
//   const statusCode = getStatusCodeFromPrismaError(error.code);

//   const metaInfo = formateErrorMeta(error.meta);

//   let cleanMessage = error.message;

//   cleanMessage=cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i,"");

//   const lines=cleanMessage.split("\n").filter(line=>line.trim());

//   const errorSources:string[]=[];

// };
