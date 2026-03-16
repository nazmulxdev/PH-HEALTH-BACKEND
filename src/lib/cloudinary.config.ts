import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "../config/env";
import AppError from "../shared/AppError";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

export const deleteFileFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)?$/;

    const match = url.match(regex);
    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      console.log(`File with public ID ${publicId} deleted successfully.`);
    }
  } catch (error) {
    console.error(error);
    throw new AppError(
      500,
      "Failed to delete file from cloudinary",
      "cloudinaryUpload",
      [
        {
          field: "url",
          message: "Failed to delete file from cloudinaryUpload",
        },
      ],
    );
  }
};

export const uploadFileToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse> => {
  if (!buffer || !fileName) {
    throw new AppError(
      500,
      "Failed to upload file to cloudinary",
      "cloudinaryUpload",
      [
        {
          field: "url",
          message: "Failed to upload file to cloudinaryUpload",
        },
      ],
    );
  }

  const fileExtension = fileName.split(".").pop()?.toLowerCase();

  const fileNameWithoutExtension = fileName
    .split(".")
    .slice(0, -1)
    .join(".")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "");

  const uniqueName =
    Math.random().toString(36).substring(2) +
    "-" +
    Date.now() +
    "-" +
    fileNameWithoutExtension;

  const folder = fileExtension === "pdf" ? "pdf-files" : "image-files";

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: `ph-healthcare/${folder}/${uniqueName}`,
          folder: `ph-healthcare/${folder}`,
        },
        (error, result) => {
          if (error) {
            return reject(
              new AppError(
                500,
                "Failed to upload file to cloudinary",
                "cloudinaryUpload",
                [
                  {
                    field: "url",
                    message: "Failed to upload file to cloudinaryUpload",
                  },
                ],
              ),
            );
          }
          resolve(result as UploadApiResponse);
        },
      )
      .end(buffer);
  });
};

export const cloudinaryUpload = cloudinary;
