/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

import { PaymentStatus } from "../../generated/prisma/enums";

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
      });

      if (!appointment) {
        console.error("Appointment not found.");
        return {
          message: "Appointment not found",
          success: false,
          data: null,
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
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
        await tx.payment.update({
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
          },
        });
      });

      console.log(
        `Processed checkout. Session completed for the appointment ${appointmentId}  and payment ${paymentId}`,
      );
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
