import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // ✅ ฟังก์ชันหลัก: ส่งอีเมลยืนยันบัญชี
  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;

    const html = this.getVerificationTemplate(verifyUrl);

    try {
      const result = await this.transporter.sendMail({
        from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `ยืนยันอีเมลของคุณ - ${process.env.APP_NAME}`,
        html,
      });

      this.logger.log(`📧 Verification email sent to: ${email}, messageId: ${result.messageId}`);
    } catch (error) {
      this.logger.error('❌ Failed to send verification email', error);
    }
  }

  // ✅ HTML Template
  private getVerificationTemplate(verifyUrl: string): string {
    return `
<div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #1c1c1c; color: #f5f5f5; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.6);">
  <div style="text-align: center;">
    <h1 style="color: #e50914; margin-bottom: 8px;">${process.env.APP_NAME || 'NestJs Auth'}</h1>
    <p style="font-size: 1.1em; color: #cccccc; margin-bottom: 30px;">
      ขอบคุณที่สมัครใช้งาน! กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ
    </p>
    <a href="${verifyUrl}" 
       style="display: inline-block; background-color: #e50914; color: white; padding: 14px 28px; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 1em;">
      ✅ ยืนยันอีเมล
    </a>
    <p style="margin-top: 30px; font-size: 0.9em; color: #888888;">
      ลิงก์จะหมดอายุภายใน 15 นาที<br>
      หากคุณไม่ได้สมัครใช้งาน กรุณาเพิกเฉยต่ออีเมลฉบับนี้
    </p>
    <hr style="margin: 30px 0; border: 0; border-top: 1px solid #333;">
    <p style="font-size: 0.75em; color: #666;">© ${new Date().getFullYear()} ${process.env.APP_NAME || 'NestJs Auth'}. All rights reserved.</p>
  </div>
</div>

    `;
  }

  // ✅ ใช้สำหรับทดสอบระบบเมล
  async testEmail() {
    await this.transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to: ['nattkarn.p@hotmail.com'],
      subject: `📬 Test Email - ${process.env.APP_NAME}`,
      html: `<p>This is a <strong>test</strong> email from ${process.env.APP_NAME}.</p>`,
    });
  }
}
