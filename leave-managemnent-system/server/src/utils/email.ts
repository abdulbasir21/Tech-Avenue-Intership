import nodemailer from 'nodemailer';
import { EmailStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  event: string;
  userId?: string;
  notificationId?: string;
}

function formatFromAddress(): string {
  const rawFrom = env.EMAIL_FROM.trim();
  if (rawFrom.includes('@')) {
    return rawFrom;
  }
  const senderEmail =
    env.smtpUser && env.smtpUser.includes('@') ? env.smtpUser : 'no-reply@example.com';
  return `"${rawFrom}" <${senderEmail}>`;
}

async function sendViaSmtp(input: SendEmailInput): Promise<void> {
  if (!env.smtpHost || !env.smtpPort || !env.smtpUser || !env.smtpPass) {
    throw new Error(
      'SMTP configuration is incomplete (SMTP_HOST/EMAIL_HOST, SMTP_PORT/EMAIL_PORT, SMTP_USER/EMAIL_USER, SMTP_PASS/EMAIL_PASS)',
    );
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  await transporter.sendMail({
    from: formatFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text,
  });
}

async function sendViaBrevoApi(input: SendEmailInput): Promise<void> {
  if (!env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is required when EMAIL_PROVIDER=brevo_api');
  }

  const senderEmail = env.EMAIL_FROM.includes('@')
    ? env.EMAIL_FROM
    : env.smtpUser && env.smtpUser.includes('@')
      ? env.smtpUser
      : 'no-reply@example.com';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: senderEmail },
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html ?? `<p>${input.text}</p>`,
      textContent: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${body}`);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; error?: string }> {
  let status: EmailStatus = EmailStatus.SENT;
  let errorMessage: string | null = null;

  try {
    if (env.NODE_ENV === 'test' || env.EMAIL_PROVIDER === 'console') {
      if (env.NODE_ENV !== 'test') {
        console.info(
          `[EMAIL:CONSOLE] To=${input.to} | Event=${input.event} | Subject=${input.subject}\n${input.text}`,
        );
      }
    } else if (env.EMAIL_PROVIDER === 'smtp') {
      await sendViaSmtp(input);
    } else if (env.EMAIL_PROVIDER === 'brevo_api') {
      await sendViaBrevoApi(input);
    }
  } catch (err) {
    status = EmailStatus.FAILED;
    errorMessage = err instanceof Error ? err.message : 'Unknown email transport error';
    if (env.NODE_ENV !== 'test') {
      console.error(`[EMAIL:FAILED] To=${input.to} | Event=${input.event} | Error=${errorMessage}`);
    }
  }

  try {
    await prisma.emailLog.create({
      data: {
        userId: input.userId ?? null,
        notificationId: input.notificationId ?? null,
        toEmail: input.to,
        subject: input.subject,
        event: input.event,
        status,
        errorMessage,
      },
    });
  } catch (logErr) {
    if (env.NODE_ENV !== 'test') {
      console.error('Failed to persist email_logs entry:', logErr);
    }
  }

  return status === EmailStatus.SENT
    ? { sent: true }
    : { sent: false, error: errorMessage ?? 'Failed to send email' };
}
