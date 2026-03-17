/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "express";
import { deleteFileFromCloudinary } from "../lib/cloudinary.config";

export const deleteUploadedFilesFromGlobalErrorHandlers = async (
  req: Request,
) => {
  try {
    const filesToDelete: string[] = [];

    if (req?.file && req?.file?.path) {
      filesToDelete.push(req.file.path);
    } else if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file.path) {
              filesToDelete.push(file.path);
            }
          });
        }
      });
    } else if (req.files && Array.isArray(req.files)) {
      req.files.map((file) => {
        if (file.path) {
          filesToDelete.push(file.path);
        }
      });
    }

    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map((filePath) => deleteFileFromCloudinary(filePath)),
      );
      console.log(
        `\nDeleted ${filesToDelete.join(", ")} uploaded files from cloudinary due to an error during request process.\n`,
      );
    }
  } catch (error: any) {
    console.error(
      "Error in deleteUploadedFilesFromGlobalErrorHandlers: ",
      error,
    );
  }
};
