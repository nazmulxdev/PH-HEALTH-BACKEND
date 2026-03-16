import * as z from "zod";

// model Specialty {
//     id String @id @default(uuid(7))

//     title       String  @unique @db.VarChar(100)
//     description String? @db.Text
//     icon        String? @db.VarChar(225)

//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt

//     isDeleted         Boolean           @default(false)
//     deletedAt         DateTime?
//     doctorSpecialties DoctorSpecialty[]

//     @@index([isDeleted], name: "idx_specialty_isDeleted")
//     @@index([title], name: "idx_specialty_title")
//     @@map("specialties")
// }

// model DoctorSpecialty {
//     id          String @id @default(uuid(7))
//     doctorId    String
//     specialtyId String

//     doctor Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade, onUpdate: Cascade)

//     specialty Specialty @relation(fields: [specialtyId], references: [id], onDelete: Cascade, onUpdate: Cascade)

//     @@unique([doctorId, specialtyId])
//     @@index([doctorId], name: "idx_doctor_specialty_doctorId")
//     @@index([specialtyId], name: "idx_name_doctor_specialty_specialtyId")
//     @@map("doctorSpecialties")
// }

const createSpecialtyZdSchema = z.object({
  title: z.string("title is required"),
  description: z.string().optional(),
});

export const specialtyValidation = {
  createSpecialtyZdSchema,
};
