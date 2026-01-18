const nodemailer = require('nodemailer');

let transporter = null;
let emailInitialized = false;

const initializeEmail = () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email credentials not configured. Password reset emails will be unavailable.');
      return false;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Gmail App Password (not regular password)
      }
    });

    emailInitialized = true;
    console.log('✅ Email service initialized');
    return true;
  } catch (error) {
    console.error('❌ Email initialization error:', error.message);
    return false;
  }
};

const getTransporter = () => transporter;
const isInitialized = () => emailInitialized;

module.exports = {
  initializeEmail,
  getTransporter,
  isInitialized
};
