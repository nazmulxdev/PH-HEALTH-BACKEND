// create specialty

import { Request, Response } from "express";
import { specialtyService } from "./specialty.service";

const createSpecialty = async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await specialtyService.createSpecialty(payload);

  return res.status(201).send({
    success: true,
    message: "Specialty created successfully.",
    data: result,
  });
};

export const specialtyController = {
  createSpecialty,
};
