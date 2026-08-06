/* -------------------------------------------------------------
   TokenBounty.io - Enterprise Email Verification Engine
   Sender: info@tokenbounty.io (Spacemail SMTP)
   ------------------------------------------------------------- */

const nodemailer = require('nodemailer');

// Spacemail / Spaceship SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.spacemail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // SSL/TLS
    auth: {
        user: process.env.SMTP_USER || 'info@tokenbounty.io',
        pass: process.env.SMTP_PASS || 'Guney51080.' // Updated per user request
    }
});

async function sendVerificationCodeEmail(targetEmail, code) {
    const htmlTemplate = `
    <div style="background-color: #05070a; font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #ffffff; padding: 40px 20px; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background: #0b0f19; border: 1px solid rgba(0, 242, 254, 0.4); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
            <div style="display: inline-block; background: linear-gradient(135deg, #00f2fe, #00ff87); width: 60px; height: 60px; border-radius: 16px; line-height: 60px; font-size: 28px; color: #000; font-weight: 800; margin-bottom: 20px;">💎</div>
            <h1 style="font-size: 26px; font-weight: 800; margin-bottom: 10px; color: #ffffff;">TokenBounty<span style="color: #00ff87;">.io</span></h1>
            <p style="color: #a1b2c6; font-size: 15px; margin-bottom: 30px;">Hesabınızı doğrulamak ve Airdrop platformumuza giriş yapmak için gereken 6 haneli güvenlik kodunuz:</p>
            
            <div style="background: rgba(0, 242, 254, 0.1); border: 2px dashed #00f2fe; border-radius: 16px; padding: 20px; display: inline-block; margin-bottom: 30px;">
                <span style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #00ff87; font-family: monospace;">${code}</span>
            </div>
            
            <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">Bu kod 10 dakika süreyle geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı güvenle göz ardı edebilirsiniz.</p>
        </div>
    </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: '"TokenBounty.io Security" <info@tokenbounty.io>',
            to: targetEmail,
            bcc: 'info@tokenbounty.io', // Admin'e kopya gitsin ki gönderildiğini görsün
            subject: `🔑 ${code} - TokenBounty.io E-posta Doğrulama Kodunuz`,
            html: htmlTemplate
        });
        console.log(`✉️ Email sent successfully to ${targetEmail}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Email send error (fallback mode enabled):", error.message);
        // Fallback for local testing if SMTP credentials are pending
        return { success: true, fallback: true, code };
    }
}

module.exports = { sendVerificationCodeEmail };
