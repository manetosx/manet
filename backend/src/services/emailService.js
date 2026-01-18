const { getTransporter, isInitialized } = require('../config/email');

const sendPasswordResetEmail = async (email, code, username) => {
  if (!isInitialized()) {
    console.log('⚠️  Email service not initialized, cannot send password reset email');
    return { success: false, error: 'Email service unavailable' };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: `"maNet" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Code - maNet',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007AFF; color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; }
          .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
          .message { font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px; }
          .code-container { background-color: #f8f9fa; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: bold; color: #007AFF; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .expiry { font-size: 14px; color: #999; margin-top: 15px; }
          .warning { font-size: 13px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; line-height: 1.5; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>maNet</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${username || 'there'},</p>
            <p class="message">We received a request to reset your password. Use the code below to complete the process:</p>
            <div class="code-container">
              <div class="code">${code}</div>
              <p class="expiry">This code will expire in <strong>1 hour</strong></p>
            </div>
            <p class="message">Enter this code in the app to set your new password.</p>
            <p class="warning">If you did not request a password reset, please ignore this email. Your password will remain unchanged. If you have concerns about your account security, please contact support.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} maNet. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hello ${username || 'there'},

We received a request to reset your password.

Your password reset code is: ${code}

This code will expire in 1 hour.

If you did not request this, please ignore this email.

- The maNet Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail
};
