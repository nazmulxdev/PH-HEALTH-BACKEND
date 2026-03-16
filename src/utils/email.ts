import nodemailer from "nodemailer";
import { config } from "../config/env";
import path from "node:path";
import ejs from "ejs";

const transporter = nodemailer.createTransport({
  host: config.EMAIL_SENDER_SMTP_HOST,
  port: parseInt(config.EMAIL_SENDER_SMTP_PORT),
  secure: true,
  auth: {
    user: config.EMAIL_SENDER_SMTP_USER,
    pass: config.EMAIL_SENDER_SMTP_PASSWORD,
  },
});

interface ISendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, unknown>;
  attachments?: {
    filename: string;
    path: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async (payload: ISendEmailOptions) => {
  try {
    const templatePath = path.resolve(
      process.cwd(),
      `src/templates/${payload.templateName}.ejs`,
    );

    const html = await ejs.renderFile(templatePath, payload.templateData);

    const info = await transporter.sendMail({
      from: config.EMAIL_SENDER_SMTP_FROM,
      to: payload.to,
      subject: payload.subject,
      html,
      attachments: payload?.attachments?.map((attachment) => ({
        filename: attachment.filename,
        path: attachment.path,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    console.log(`Email send to ${payload.to} : ${info.messageId}`);
  } catch (error) {
    console.error("Email Sending error", error);
    throw error;
  }
};

export default transporter;
