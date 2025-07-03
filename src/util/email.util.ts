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
    const verifyUrl = `${process.env.APP_URL}/api/user/verify-email?token=${token}`;

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
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background-color:#121212;color:#E0E0E0;border-radius:8px;">
        <h2 style="color:#E50914;">TrackFlix 🎬</h2>
        <p>กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันการสมัครสมาชิก</p>
        <a href="${verifyUrl}" 
           style="display:inline-block;margin-top:20px;background-color:#E50914;color:white;padding:12px 20px;border-radius:5px;text-decoration:none;">
          ยืนยันอีเมล
        </a>
        <p style="margin-top:20px;font-size:0.9em;color:#9E9E9E;">ลิงก์นี้จะหมดอายุภายใน 15 นาที</p>
      </div>
    `;
  }

  // ✅ ใช้สำหรับทดสอบระบบเมล
  async testEmail() {
    await this.transporter.sendMail({
      from: `"TrackFlix" <${process.env.EMAIL_USER}>`,
      to: ['nattkarn.p@hotmail.com'],
      subject: '📬 Test Email - TrackFlix',
      html: '<p>This is a <strong>test</strong> email from TrackFlix.</p>',
    });
  }
}
