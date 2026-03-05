import { Specialty } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createSpecialty = async (payload: Specialty): Promise<Specialty> => {
  const specialty = await prisma.specialty.create({
    data: payload,
  });

  return specialty;
};

// get specialty

const getAllSpecialty = async (): Promise<Specialty[]> => {
  const specialty = await prisma.specialty.findMany();

  return specialty;
};

// delete specialty

const deleteSpecialty = async (id: string): Promise<Specialty> => {
  const deleteSpecialty = await prisma.specialty.delete({
    where: {
      id: id,
    },
  });

  return deleteSpecialty;
};

// update specialty

const updateSpecialty = async (
  payload: Partial<Specialty>,
  id: string,
): Promise<Specialty> => {
  const deleteSpecialty = await prisma.specialty.update({
    where: {
      id: id,
    },
    data: payload,
  });

  return deleteSpecialty;
};

export const specialtyService = {
  createSpecialty,
  getAllSpecialty,
  deleteSpecialty,
  updateSpecialty,
};
