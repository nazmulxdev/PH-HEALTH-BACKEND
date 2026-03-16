/* eslint-disable @typescript-eslint/no-explicit-any */
// create specialty

import { Request, Response } from "express";
import { specialtyService } from "./specialty.service";
import catchAsync from "../../shared/catchAsync";
import AppResponse from "../../shared/AppResponse";

const createSpecialty = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, icon: req.file?.path };
  const result = await specialtyService.createSpecialty(payload);

  AppResponse(res, {
    success: true,
    statusCode: 201,
    message: "Specialty created successfully.",
    data: result,
  });
});

// get all specialty

const getAllSpecialty = async (req: Request, res: Response) => {
  try {
    console.log(req.user);
    const result = await specialtyService.getAllSpecialty();

    return res.status(201).send({
      success: true,
      message: "Specialty created successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create specialty.",
      error: error.message,
    });
  }
};

// delete specialty

const deleteSpecialty = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const result = await specialtyService.deleteSpecialty(id);
    return res.status(201).send({
      success: true,
      message: "Specialty created successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create specialty.",
      error: error.message,
    });
  }
};

// update specialty

const updateSpecialty = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const payload = req.body;
    const result = await specialtyService.updateSpecialty(payload, id);
    return res.status(201).send({
      success: true,
      message: "Specialty created successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create specialty.",
      error: error.message,
    });
  }
};

export const specialtyController = {
  createSpecialty,
  getAllSpecialty,
  deleteSpecialty,
  updateSpecialty,
};
