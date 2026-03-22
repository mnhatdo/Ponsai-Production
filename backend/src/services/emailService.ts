import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface OTPEmailData {
  name: string;
  otp: string;
  expiresIn?: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

const getResendApiKey = (): string => (process.env.RESEND_API_KEY || '').trim();

const getFromAddress = (): string => {
  return (process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ponsai.com').trim();
};

const sendViaResend = async (options: EmailOptions): Promise<boolean> => {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📧 Resend API error [${response.status}]:`, errorText);
      return false;
    }

    const data = (await response.json()) as ResendResponse;
    console.log('📧 Email sent via Resend API:', data.id || 'ok');
    return true;
  } catch (error) {
    console.error('📧 Resend send failed:', error);
    return false;
  }
};

// Create transporter based on environment
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = parseInt((process.env.SMTP_PORT || '587').trim(), 10);
  const smtpSecure = (process.env.SMTP_SECURE || 'false').trim().toLowerCase() === 'true';
  const smtpUser = process.env.SMTP_USER?.trim();
  let smtpPass = process.env.SMTP_PASS?.trim();

  // Gmail app password is often copied in 4-char blocks separated by spaces.
  // Normalize it to avoid authentication failures caused by formatting.
  if (smtpHost?.includes('gmail.com') && smtpPass) {
    smtpPass = smtpPass.replace(/\s+/g, '');
  }

  // For production, use real SMTP service (Gmail, SendGrid, AWS SES, etc.)
  if (process.env.NODE_ENV === 'production') {
    if (!smtpHost || !smtpUser || !smtpPass) {
      return null;
    }

    if (Number.isNaN(smtpPort)) {
      console.error('📧 Email service: Invalid SMTP_PORT value');
      return null;
    }

    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for other ports
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  // For development, use Gmail or Ethereal (fake SMTP)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // Use App Password for Gmail
      }
    });
  }

  // Fallback: Use Ethereal (fake SMTP for testing)
  return null;
};

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter
export const initEmailService = async () => {
  transporter = createTransporter();
  
  if (!transporter) {
    if (getResendApiKey()) {
      console.log('📧 Email service: SMTP unavailable, Resend API fallback enabled');
      return;
    }

    console.warn('📧 Email service: Disabled (missing SMTP and RESEND_API_KEY configuration)');
    return;
  }

  try {
    await transporter.verify();
    console.log('📧 Email service: Connected successfully');
  } catch (error) {
    console.error('📧 Email service: Connection failed', error);
    transporter = null;

    if (getResendApiKey()) {
      console.log('📧 Email service: Using Resend API fallback after SMTP failure');
    }
  }
};

// Generate OTP Email HTML Template
const generateOTPEmailTemplate = (data: OTPEmailData): string => {
  const { name, otp, expiresIn = '10 minutes' } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Ponsai</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b5d50 0%, #5a8a7a 100%); padding: 40px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Ponsai</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Bonsai & Home Decor</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #2f2f2f; font-size: 24px; font-weight: 600;">Verify Your Email</h2>
              <p style="margin: 0 0 20px; color: #6c757d; font-size: 16px; line-height: 1.6;">
                Hi <strong style="color: #2f2f2f;">${name}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #6c757d; font-size: 16px; line-height: 1.6;">
                Thank you for creating an account with Ponsai! Please use the verification code below to complete your registration:
              </p>
              
              <!-- OTP Box -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #3b5d50; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px;">
                <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div style="font-size: 36px; font-weight: 700; color: #3b5d50; letter-spacing: 8px; font-family: monospace;">
                  ${otp}
                </div>
              </div>
              
              <p style="margin: 0 0 20px; color: #6c757d; font-size: 14px; line-height: 1.6;">
                ⏰ This code will expire in <strong>${expiresIn}</strong>.
              </p>
              
              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                If you didn't create an account with Ponsai, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@ponsai.com" style="color: #3b5d50; text-decoration: none;">support@ponsai.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Ponsai. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Generate Welcome Email Template
const generateWelcomeEmailTemplate = (name: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ponsai!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b5d50 0%, #5a8a7a 100%); padding: 50px 40px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 20px;">🌿</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to Ponsai!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #6c757d; font-size: 16px; line-height: 1.6;">
                Hi <strong style="color: #2f2f2f;">${name}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #6c757d; font-size: 16px; line-height: 1.6;">
                Your email has been verified and your account is now active! Welcome to our community of bonsai and home decor enthusiasts.
              </p>
              
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #2f2f2f; font-size: 18px;">What you can do now:</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #6c757d; font-size: 14px; line-height: 2;">
                  <li>🌱 Browse our curated bonsai collection</li>
                  <li>🛒 Add items to your cart and checkout</li>
                  <li>💝 Save your favorite products</li>
                  <li>📦 Track your orders easily</li>
                </ul>
              </div>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}" 
                 style="display: inline-block; background-color: #3b5d50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                Start Shopping
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@ponsai.com" style="color: #3b5d50; text-decoration: none;">support@ponsai.com</a>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Ponsai. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (transporter) {
    try {
      const mailOptions = {
        from: `"Ponsai" <${getFromAddress()}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent via SMTP: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('📧 SMTP send failed:', error);
    }
  }

  const resendOk = await sendViaResend(options);
  if (resendOk) {
    return true;
  }

  console.log(`📧 [DEV/FALLBACK] Would send email to: ${options.to}`);
  console.log(`📧 [DEV/FALLBACK] Subject: ${options.subject}`);
  return false;
};

// Send OTP Email
export const sendOTPEmail = async (to: string, name: string, otp: string): Promise<boolean> => {
  const html = generateOTPEmailTemplate({ name, otp, expiresIn: '10 minutes' });
  
  return sendEmail({
    to,
    subject: '🔐 Verify Your Email - Ponsai',
    html,
    text: `Hi ${name}, your verification code is: ${otp}. This code expires in 10 minutes.`
  });
};

// Send Welcome Email
export const sendWelcomeEmail = async (to: string, name: string): Promise<boolean> => {
  const html = generateWelcomeEmailTemplate(name);
  
  return sendEmail({
    to,
    subject: 'Welcome to Ponsai!',
    html,
    text: `Hi ${name}, welcome to Ponsai! Your account is now active.`
  });
};

export default {
  initEmailService,
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail
};
