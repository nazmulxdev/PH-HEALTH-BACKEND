/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

import { PaymentStatus } from "../../generated/prisma/enums";
import { generateInvoicePdf } from "./payment.utils";
import { uploadFileToCloudinary } from "../../lib/cloudinary.config";
import { sendEmail } from "../../utils/email";

const handleStripeWebHookEvent = async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    console.log(`Event ${event.id} already processed. Skipping`);

    return {
      message: `Event ${event.id} already processed. Skipping`,
      success: false,
      data: null,
    };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const appointmentId = session?.metadata?.appointmentId;

      const paymentId = session?.metadata?.paymentId;

      console.log("Session metadata:", session.metadata);

      if (!appointmentId || !paymentId) {
        console.error("Missing appointment or paymentId in the session.");
        return {
          message: "Missing appointmentId or paymentId",
          success: false,
          data: null,
        };
      }

      const appointment = await prisma.appointment.findUnique({
        where: {
          id: appointmentId,
        },
        include: {
          prescription: true,
          doctor: {
            include: {
              specialties: {
                include: {
                  specialty: true,
                },
              },
            },
          },
          patient: true,
          schedule: true,
          payment: true,
        },
      });

      if (!appointment) {
        console.error("Appointment not found.");
        return {
          message: "Appointment not found",
          success: false,
          data: null,
        };
      }
      let invoiceUrl = "";
      let pdfBuffer: Buffer | null = null;

      const result = await prisma.$transaction(async (tx) => {
        const updateAppointment = await tx.appointment.update({
          where: {
            id: appointmentId,
          },
          data: {
            paymentStatus:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            payment: {
              connect: {
                id: paymentId,
              },
            },
          },
        });

        // if payment is successful , generate  and upload invoice

        if (session.payment_status === "paid") {
          try {
            pdfBuffer = await generateInvoicePdf({
              prescriptionId: appointment?.prescription?.id as string,
              invoiceId: paymentId,
              doctorName: appointment.doctor.name,
              doctorEmail: appointment.doctor.email,
              patientName: appointment.patient.name,
              patientEmail: appointment.patient.email,
              appointmentDate: appointment.schedule.startDateTime,
              amount: Number(appointment.payment?.amount),
              createdAt: new Date(),
              paymentStatus: session.payment_status,
              paymentId: paymentId,
              paymentDate: new Date(),
            });

            const fileName = `prescription-${Date.now()}-${paymentId}.pdf`;

            const cloudinaryFile = await uploadFileToCloudinary(
              pdfBuffer,
              fileName,
            );

            invoiceUrl = cloudinaryFile.secure_url;

            console.log("Payment invoice pdf url", invoiceUrl);
          } catch (error) {
            console.error(error);
          }
        }

        const updatePayment = await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            stripeEventId: event.id,
            status:
              session.payment_status === "paid"
                ? PaymentStatus.PAID
                : PaymentStatus.UNPAID,
            paymentGatewayData: session as any,
            invoiceUrl: invoiceUrl,
          },
        });

        return { updateAppointment, updatePayment, invoiceUrl };
      });

      if (session.payment_status === "paid" && result.invoiceUrl) {
        try {
          await sendEmail({
            to: appointment.patient.email,
            subject: `Payment confirmation & invoice - Appointment with ${appointment.doctor.name}`,
            templateName: "invoice",
            templateData: {
              patientName: appointment.patient.name,
              invoiceId: paymentId,
              transactionId: paymentId,
              paymentDate: appointment.payment?.createdAt,
              doctorName: appointment.doctor.name,
              appointmentDate: appointment.schedule.startDateTime,
              amount: appointment.payment?.amount,
              invoiceUrl: result.invoiceUrl,
            },
            attachments: [
              {
                filename: `prescription-${Date.now()}-${paymentId}.pdf`,
                content: pdfBuffer || Buffer.from(""),
                contentType: "application/pdf",
                path: result.invoiceUrl,
              },
            ],
          });

          console.log(
            `Invoice email send to ${appointment.patient.email} successfully`,
          );
        } catch (error) {
          console.log(error);
        }
      }

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log(
        `checkout session ${session.id} expired. Marking associate payment as failed.`,
      );
      break;
    }
    case "payment_intent.payment_failed": {
      const session = event.data.object;

      console.log(
        `Payment intend ${session.id} expired . Marking associate payment as  failed .`,
      );
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
      break;
  }

  return { message: `Webhook Event ${event.id} processed successfully.` };
};

export const paymentService = {
  handleStripeWebHookEvent,
};
