import { NextFunction, Request, Response } from "express";
import { IUpdatePatientProfilePayload } from "./patient.interface";

export const updateMyPatientProfileMiddleWare = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body.data) {
    req.body = JSON.parse(req.body.data);
  }

  const payload: IUpdatePatientProfilePayload = req.body;

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[] | undefined;
  };

  console.log(files);

  if (files?.profilePhoto?.[0]) {
    if (!payload.patientInfo) {
      payload.patientInfo = {};
    }

    payload.patientInfo.profilePhoto = files.profilePhoto[0].path;
  }

  if (files?.medicalReports && files.medicalReports.length > 0) {
    const newReports = files.medicalReports.map((file) => {
      return {
        reportName:
          file.originalname || `Medical Report -${new Date().getTime()}`,
        reportLink: file.path,
      };
    });
    if (payload.medicalReports && Array.isArray(payload.medicalReports)) {
      payload.medicalReports = [...payload.medicalReports, ...newReports];
    } else {
      payload.medicalReports = newReports;
    }
  }

  req.body = payload;

  next();
};
