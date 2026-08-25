const brevoClient = require('../config/brevo');

/**
 * Format month number to month name
 */
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format amount to Indian Rupees
 */
const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Send payment confirmation email
 * @param {Object} data - Payment data
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.flat_no - Flat number
 * @param {number} data.amount - Payment amount
 * @param {number} data.month - Month (1-12)
 * @param {number} data.year - Year
 * @param {string} data.transaction_id - Razorpay payment ID
 * @param {Date} data.payment_date - Payment date
 */
exports.sendPaymentConfirmation = async (data) => {
  try {
    const { email, name, flat_no, amount, month, year, transaction_id, payment_date } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDate = new Date(payment_date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `Payment Confirmation - Maintenance for ${monthName} ${year}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Rajarshi Darshan Society</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Payment Confirmation</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
            
            <p>Thank you for your payment! Your maintenance payment has been successfully received.</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Payment Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Flat No:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Month:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${monthName} ${year}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Amount Paid:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; color: #22c55e; font-size: 18px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Transaction ID:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; font-family: monospace; font-size: 12px;">${transaction_id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Payment Date:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${formattedDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
              <span style="color: #22c55e; font-size: 24px;">✓</span>
              <p style="margin: 5px 0 0 0; color: #166534; font-weight: bold;">Payment Successful</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Please save this email for your records. If you have any questions regarding this payment, 
              please contact the society office.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
              This is an automated email from Rajarshi Darshan Society Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Payment Confirmation - Rajarshi Darshan Society
        
        Dear ${name},
        
        Thank you for your payment! Your maintenance payment has been successfully received.
        
        Payment Details:
        - Flat No: ${flat_no}
        - Month: ${monthName} ${year}
        - Amount Paid: ${formattedAmount}
        - Transaction ID: ${transaction_id}
        - Payment Date: ${formattedDate}
        
        Please save this email for your records.
        
        Thank you,
        Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Payment confirmation email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
};

/**
 * Send maintenance reminder email
 * @param {Object} data - Reminder data
 */
exports.sendMaintenanceReminder = async (data) => {
  try {
    const { email, name, flat_no, amount, month, year, due_date, is_overdue = false } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDueDate = new Date(due_date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const subject = is_overdue 
      ? `Overdue: Maintenance Payment for ${monthName} ${year}`
      : `Reminder: Maintenance Payment Due for ${monthName} ${year}`;

    const urgencyColor = is_overdue ? '#ef4444' : '#f59e0b';
    const urgencyText = is_overdue ? 'OVERDUE' : 'REMINDER';

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${urgencyColor}; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Rajarshi Darshan Society</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">${urgencyText}: Maintenance Payment</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>This is a ${is_overdue ? 'final notice' : 'friendly reminder'} that your maintenance payment for <strong>${monthName} ${year}</strong> is ${is_overdue ? 'overdue' : 'pending'}.</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666;">Flat No:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Amount Due:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: ${urgencyColor};">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Due Date:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${formattedDueDate}</td>
                </tr>
              </table>
            </div>
            
            ${is_overdue ? '<p style="color: #ef4444;"><strong>Note:</strong> A late fee of ₹100 has been applied to your account.</p>' : ''}
            
            <p>Please log in to the Society Management Portal to make your payment.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Rajarshi Darshan Society Management System
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        ${urgencyText}: Maintenance Payment - Rajarshi Darshan Society
        
        Dear ${name},
        
        This is a ${is_overdue ? 'final notice' : 'friendly reminder'} that your maintenance payment for ${monthName} ${year} is ${is_overdue ? 'overdue' : 'pending'}.
        
        Flat No: ${flat_no}
        Amount Due: ${formattedAmount}
        Due Date: ${formattedDueDate}
        
        ${is_overdue ? 'Note: A late fee of ₹100 has been applied.' : ''}
        
        Please log in to make your payment.
        
        Thank you,
        Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Maintenance reminder email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending maintenance reminder email:', error);
    throw error;
  }
};

/**
 * Send maintenance invoice email (Day 1 of month)
 * @param {Object} data - Invoice data
 */
exports.sendMaintenanceInvoice = async (data) => {
  try {
    const { email, name, flat_no, amount, month, year, due_date } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDueDate = formatDate(due_date);

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `Maintenance Invoice - ${monthName} ${year} | Rajarshi Darshan Society`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🏢 Rajarshi Darshan Society</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Monthly Maintenance Invoice</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>Your maintenance invoice for <strong>${monthName} ${year}</strong> has been generated.</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0D9488; border-bottom: 2px solid #0D9488; padding-bottom: 10px;">Invoice Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Flat No:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Period:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${monthName} ${year}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Amount Due:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right; color: #0D9488; font-size: 20px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Due Date:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #ef4444;">${formattedDueDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⚠️ Important:</strong> A late fee of ₹100 will be applied if payment is not received by the due date.
              </p>
            </div>
            
            <p>Please log in to the Society Management Portal to make your payment.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/maintenance" 
                 style="background: #0D9488; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Pay Now
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated email from Rajarshi Darshan Society Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Maintenance Invoice - ${monthName} ${year}
        Rajarshi Darshan Society
        
        Dear ${name},
        
        Your maintenance invoice for ${monthName} ${year} has been generated.
        
        Invoice Details:
        - Flat No: ${flat_no}
        - Period: ${monthName} ${year}
        - Amount Due: ${formattedAmount}
        - Due Date: ${formattedDueDate}
        
        Important: A late fee of ₹100 will be applied if payment is not received by the due date.
        
        Please log in to make your payment.
        
        Thank you,
        Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Maintenance invoice email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending maintenance invoice email:', error);
    throw error;
  }
};

/**
 * Send final warning email (Day 16 - 2 days before late fee)
 * @param {Object} data - Warning data
 */
exports.sendFinalWarning = async (data) => {
  try {
    const { email, name, flat_no, amount, month, year, due_date } = data;

    const monthName = getMonthName(month);
    const formattedAmount = formatAmount(amount);
    const formattedDueDate = formatDate(due_date);

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `⚠️ FINAL WARNING: Maintenance Payment Due in 2 Days | ${monthName} ${year}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">⚠️ FINAL WARNING</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Maintenance Payment Due in 2 Days</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>This is a <strong style="color: #ef4444;">FINAL REMINDER</strong> that your maintenance payment for <strong>${monthName} ${year}</strong> is still pending.</p>
            
            <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: bold;">
                ⏰ Only 2 days left before late fee is applied!
              </p>
            </div>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #666;">Flat No:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Amount Due:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #ef4444; font-size: 20px;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Due Date:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #ef4444;">${formattedDueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Late Fee After Due Date:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">₹100</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #dc2626;">
              <strong>Please make your payment immediately to avoid the late fee.</strong>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/maintenance" 
                 style="background: #ef4444; color: white; padding: 15px 40px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                PAY NOW - Avoid Late Fee
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Rajarshi Darshan Society Management System
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        ⚠️ FINAL WARNING: Maintenance Payment Due in 2 Days
        Rajarshi Darshan Society
        
        Dear ${name},
        
        This is a FINAL REMINDER that your maintenance payment for ${monthName} ${year} is still pending.
        
        ⏰ Only 2 days left before late fee is applied!
        
        Payment Details:
        - Flat No: ${flat_no}
        - Amount Due: ${formattedAmount}
        - Due Date: ${formattedDueDate}
        - Late Fee After Due Date: ₹100
        
        Please make your payment immediately to avoid the late fee.
        
        Thank you,
        Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Final warning email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending final warning email:', error);
    throw error;
  }
};

/**
 * Send emergency alert email to all users
 * @param {Object} data - Emergency data
 */
exports.sendEmergencyAlert = async (data) => {
  try {
    const { 
      email, 
      name, 
      triggered_by_name, 
      triggered_by_flat, 
      triggered_by_phone,
      triggered_at, 
      notes 
    } = data;

    const formattedTime = new Date(triggered_at).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: '🚨 LIFT EMERGENCY ALERT - Rajarshi Darshan Society',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <span style="font-size: 48px;">🚨</span>
            <h1 style="color: white; margin: 10px 0 0 0;">LIFT EMERGENCY</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Someone is stuck in the lift!</p>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: white; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #dc2626;">⚠️ Emergency Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; color: #666;">Triggered By:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; font-weight: bold; text-align: right;">${triggered_by_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; color: #666;">Flat No:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; font-weight: bold; text-align: right;">${triggered_by_flat}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; color: #666;">Contact:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #fee2e2; font-weight: bold; text-align: right;">
                    <a href="tel:${triggered_by_phone}" style="color: #dc2626; text-decoration: none;">${triggered_by_phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Time:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right;">${formattedTime}</td>
                </tr>
              </table>
              
              ${notes ? `
              <div style="margin-top: 15px; padding: 10px; background: #fef2f2; border-radius: 4px;">
                <strong>Notes:</strong> ${notes}
              </div>
              ` : ''}
            </div>
            
            <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                ⚡ IMMEDIATE ATTENTION REQUIRED
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                If you are nearby, please check on the lift immediately.<br>
                Contact building security or call for help if needed.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #fecaca; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated emergency alert from Rajarshi Darshan Society.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        🚨 LIFT EMERGENCY ALERT - Rajarshi Darshan Society
        
        SOMEONE IS STUCK IN THE LIFT!
        
        Emergency Details:
        - Triggered By: ${triggered_by_name}
        - Flat No: ${triggered_by_flat}
        - Contact: ${triggered_by_phone}
        - Time: ${formattedTime}
        ${notes ? `- Notes: ${notes}` : ''}
        
        ⚡ IMMEDIATE ATTENTION REQUIRED
        
        If you are nearby, please check on the lift immediately.
        Contact building security or call for help if needed.
        
        - Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Emergency alert email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending emergency alert email:', error);
    throw error;
  }
};

/**
 * Send emergency resolved email to all users
 * @param {Object} data - Resolution data
 */
exports.sendEmergencyResolved = async (data) => {
  try {
    const { 
      email, 
      name, 
      resolved_by_name, 
      resolved_by_flat,
      resolved_at,
      triggered_by_name,
      triggered_by_flat,
      triggered_at
    } = data;

    const formattedResolvedTime = new Date(resolved_at).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const formattedTriggeredTime = new Date(triggered_at).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Calculate duration
    const durationMs = new Date(resolved_at) - new Date(triggered_at);
    const durationMinutes = Math.round(durationMs / 60000);
    const durationText = durationMinutes < 60 
      ? `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`
      : `${Math.floor(durationMinutes / 60)} hour${Math.floor(durationMinutes / 60) !== 1 ? 's' : ''} ${durationMinutes % 60} minute${durationMinutes % 60 !== 1 ? 's' : ''}`;

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: '✅ Lift Emergency Resolved - Rajarshi Darshan Society',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #16a34a; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <span style="font-size: 48px;">✅</span>
            <h1 style="color: white; margin: 10px 0 0 0;">EMERGENCY RESOLVED</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">The lift emergency has been resolved</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 30px; border: 2px solid #16a34a; border-top: none; border-radius: 0 0 10px 10px;">
            <div style="background: white; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #16a34a;">📋 Resolution Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Originally Triggered By:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; font-weight: bold; text-align: right;">${triggered_by_name} (Flat ${triggered_by_flat})</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Triggered At:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; text-align: right;">${formattedTriggeredTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Resolved By:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; font-weight: bold; text-align: right;">${resolved_by_name} (Flat ${resolved_by_flat})</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; color: #666;">Resolved At:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #dcfce7; text-align: right;">${formattedResolvedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Response Time:</td>
                  <td style="padding: 10px 0; font-weight: bold; text-align: right; color: #16a34a;">${durationText}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #16a34a; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                🎉 All Clear!
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                The situation has been handled and everyone is safe.<br>
                Thank you for your attention and cooperation.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #bbf7d0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated notification from Rajarshi Darshan Society.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        ✅ LIFT EMERGENCY RESOLVED - Rajarshi Darshan Society
        
        The lift emergency has been resolved!
        
        Resolution Details:
        - Originally Triggered By: ${triggered_by_name} (Flat ${triggered_by_flat})
        - Triggered At: ${formattedTriggeredTime}
        - Resolved By: ${resolved_by_name} (Flat ${resolved_by_flat})
        - Resolved At: ${formattedResolvedTime}
        - Response Time: ${durationText}
        
        🎉 All Clear! The situation has been handled and everyone is safe.
        
        Thank you for your attention and cooperation.
        
        - Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Emergency resolved email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending emergency resolved email:', error);
    throw error;
  }
};

/**
 * Send complaint status update email
 * @param {Object} data - Complaint data
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.flat_no - Flat number
 * @param {string} data.description - Complaint description
 * @param {string} data.previous_status - Previous status
 * @param {string} data.new_status - New status
 * @param {string} data.admin_notes - Admin notes (optional)
 * @param {string} data.updated_by - Name of admin who updated
 * @param {Date} data.updated_at - Update timestamp
 */
exports.sendComplaintStatusUpdate = async (data) => {
  try {
    const { email, name, flat_no, description, previous_status, new_status, admin_notes, updated_by, updated_at } = data;

    const formattedDate = formatDate(updated_at);
    
    // Status colors and labels
    const statusConfig = {
      'open': { color: '#f59e0b', bg: '#fef3c7', label: 'Open', icon: '📋' },
      'in-progress': { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress', icon: '🔄' },
      'resolved': { color: '#22c55e', bg: '#dcfce7', label: 'Resolved', icon: '✅' }
    };

    const newStatusConfig = statusConfig[new_status] || statusConfig['open'];
    const prevStatusConfig = statusConfig[previous_status] || statusConfig['open'];

    // Truncate description for email
    const shortDescription = description.length > 200 
      ? description.substring(0, 200) + '...' 
      : description;

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: `Complaint Update: Status changed to ${newStatusConfig.label}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complaint Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Rajarshi Darshan Society</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Complaint Status Update</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
            
            <p>Your complaint status has been updated. Here are the details:</p>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">Complaint Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Flat No:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${flat_no}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Description:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">${shortDescription}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Previous Status:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
                    <span style="background: ${prevStatusConfig.bg}; color: ${prevStatusConfig.color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                      ${prevStatusConfig.icon} ${prevStatusConfig.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">New Status:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
                    <span style="background: ${newStatusConfig.bg}; color: ${newStatusConfig.color}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                      ${newStatusConfig.icon} ${newStatusConfig.label}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;">Updated By:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: bold; text-align: right;">${updated_by}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Updated On:</td>
                  <td style="padding: 10px 0; text-align: right;">${formattedDate}</td>
                </tr>
              </table>
              
              ${admin_notes ? `
              <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0d9488; border-radius: 4px;">
                <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase; font-weight: bold;">Admin Notes:</p>
                <p style="margin: 8px 0 0 0; color: #333;">${admin_notes}</p>
              </div>
              ` : ''}
            </div>
            
            ${new_status === 'resolved' ? `
            <div style="background: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; font-weight: bold;">
                ✅ Your complaint has been resolved!
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Thank you for bringing this to our attention.
              </p>
            </div>
            ` : `
            <div style="background: ${newStatusConfig.bg}; color: ${newStatusConfig.color}; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;">
                ${newStatusConfig.icon} Your complaint is now <strong>${newStatusConfig.label}</strong>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 13px;">
                We will keep you updated on any further progress.
              </p>
            </div>
            `}
            
            <p style="color: #666; font-size: 14px;">
              You can view your complaint details by logging into the society management portal.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated notification from Rajarshi Darshan Society.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Complaint Status Update - Rajarshi Darshan Society
        
        Dear ${name},
        
        Your complaint status has been updated.
        
        Complaint Details:
        - Flat No: ${flat_no}
        - Description: ${shortDescription}
        - Previous Status: ${prevStatusConfig.label}
        - New Status: ${newStatusConfig.label}
        - Updated By: ${updated_by}
        - Updated On: ${formattedDate}
        ${admin_notes ? `- Admin Notes: ${admin_notes}` : ''}
        
        ${new_status === 'resolved' 
          ? 'Your complaint has been resolved! Thank you for bringing this to our attention.' 
          : 'We will keep you updated on any further progress.'}
        
        - Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Complaint status update email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending complaint status update email:', error);
    throw error;
  }
};

/**
 * Send password reset OTP email
 * @param {Object} data - OTP data
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 * @param {string} data.otp - 6-digit OTP
 * @param {number} data.expiryMinutes - OTP expiry time in minutes
 */
exports.sendPasswordResetOTP = async (data) => {
  try {
    const { email, name, otp, expiryMinutes } = data;

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: 'Password Reset OTP - Rajarshi Darshan Society',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🏢 Rajarshi Darshan Society</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
            
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div style="background: #0D9488; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 10px 0;">Your One-Time Password (OTP)</p>
              <h2 style="color: white; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: monospace;">${otp}</h2>
            </div>
            
            <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400E; font-size: 14px;">
                <strong>⏰ Important:</strong> This OTP will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, please ignore this email or contact the society office 
              if you have concerns about your account security.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
              This is an automated email from Rajarshi Darshan Society Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Password Reset OTP - Rajarshi Darshan Society
        
        Dear ${name},
        
        We received a request to reset your password. Use the OTP below to proceed:
        
        Your OTP: ${otp}
        
        This OTP will expire in ${expiryMinutes} minutes.
        
        If you didn't request a password reset, please ignore this email.
        
        - Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Password reset OTP email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 * @param {Object} data - User data
 * @param {string} data.email - Recipient email
 * @param {string} data.name - Recipient name
 */
exports.sendPasswordResetConfirmation = async (data) => {
  try {
    const { email, name } = data;

    const sendSmtpEmail = {
      to: [{ email, name }],
      subject: 'Password Changed Successfully - Rajarshi Darshan Society',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">🏢 Rajarshi Darshan Society</h1>
            <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 10px 0 0 0;">Password Changed</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="margin-bottom: 20px;">Dear <strong>${name}</strong>,</p>
            
            <div style="background: #DCFCE7; border: 1px solid #22C55E; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <span style="color: #22C55E; font-size: 40px;">✓</span>
              <p style="margin: 10px 0 0 0; color: #166534; font-weight: bold; font-size: 18px;">Password Changed Successfully!</p>
            </div>
            
            <p>Your password has been successfully changed. You can now log in with your new password.</p>
            
            <div style="background: #FEE2E2; border: 1px solid #EF4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991B1B; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact 
                the society office immediately and consider securing your email account.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 0;">
              This is an automated email from Rajarshi Darshan Society Management System.<br>
              Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      textContent: `
        Password Changed Successfully - Rajarshi Darshan Society
        
        Dear ${name},
        
        Your password has been successfully changed. You can now log in with your new password.
        
        If you did not make this change, please contact the society office immediately.
        
        - Rajarshi Darshan Society
      `,
      sender: brevoClient.defaultSender
    };

    const response = await brevoClient.apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Password reset confirmation email sent:', email);
    return response;
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    throw error;
  }
};