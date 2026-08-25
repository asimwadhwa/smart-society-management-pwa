import { jsPDF } from 'jspdf';

interface ReceiptData {
  transactionId: string;
  amount: number;
  month: number;
  year: number;
  flatNo: string;
  paymentDate: string;
  userName: string;
  lateFee?: number;
}

const getMonthName = (month: number) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
};

const formatAmount = (amount: number) => {
  return 'Rs. ' + amount.toLocaleString('en-IN');
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const generateReceiptPDF = (data: ReceiptData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let y = 20;

  // ===== HEADER =====
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RAJARSHI DARSHAN', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Society Management System', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('Ahmedabad, Gujarat, India', pageWidth / 2, 38, { align: 'center' });

  y = 60;

  // ===== RECEIPT TITLE =====
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', pageWidth / 2, y, { align: 'center' });
  
  y += 15;

  // ===== RECEIPT INFO BOX =====
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, 'FD');
  
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Left side - Receipt No
  doc.text('Receipt No:', margin + 5, y + 10);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  const receiptNo = `RD-${data.year}${String(data.month).padStart(2, '0')}-${data.transactionId.slice(-6).toUpperCase()}`;
  doc.text(receiptNo, margin + 5, y + 18);
  
  // Right side - Date
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', margin + contentWidth - 50, y + 10);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(data.paymentDate), margin + contentWidth - 50, y + 18);

  y += 35;

  // ===== RESIDENT DETAILS TABLE =====
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resident Details', margin, y);
  
  y += 8;
  
  // Table Header
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(229, 231, 235);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(75, 85, 99);
  doc.text('Field', margin + 5, y + 7);
  doc.text('Details', margin + contentWidth / 2, y + 7);
  
  y += 10;
  
  // Resident Name Row
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Name', margin + 5, y + 7);
  doc.setTextColor(31, 41, 55);
  doc.text(data.userName, margin + contentWidth / 2, y + 7);
  
  y += 10;
  
  // Flat No Row
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  doc.setTextColor(107, 114, 128);
  doc.text('Flat Number', margin + 5, y + 7);
  doc.setTextColor(31, 41, 55);
  doc.text(data.flatNo, margin + contentWidth / 2, y + 7);

  y += 20;

  // ===== PAYMENT DETAILS TABLE =====
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details', margin, y);
  
  y += 8;
  
  // Table Header
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Description', margin + 5, y + 7);
  doc.text('Amount', margin + contentWidth - 40, y + 7);
  
  y += 10;
  
  // Payment For Row
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 10, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Maintenance - ${getMonthName(data.month)} ${data.year}`, margin + 5, y + 7);
  
  const baseAmount = data.lateFee ? data.amount - data.lateFee : data.amount;
  doc.setTextColor(31, 41, 55);
  doc.text(formatAmount(baseAmount), margin + contentWidth - 40, y + 7);
  
  y += 10;
  
  // Late Fee Row (if applicable)
  if (data.lateFee && data.lateFee > 0) {
    doc.setFillColor(254, 242, 242);
    doc.rect(margin, y, contentWidth, 10, 'FD');
    doc.setTextColor(185, 28, 28);
    doc.text('Late Fee', margin + 5, y + 7);
    doc.text(formatAmount(data.lateFee), margin + contentWidth - 40, y + 7);
    y += 10;
  }
  
  // Total Row
  doc.setFillColor(220, 252, 231);
  doc.setDrawColor(134, 239, 172);
  doc.rect(margin, y, contentWidth, 12, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL PAID', margin + 5, y + 8);
  doc.text(formatAmount(data.amount), margin + contentWidth - 40, y + 8);
  
  y += 22;

  // ===== TRANSACTION INFO =====
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'FD');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Transaction ID:', margin + 5, y + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(data.transactionId, margin + 5, y + 15);
  
  // Status Badge
  const badgeX = margin + contentWidth - 35;
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(badgeX, y + 5, 30, 10, 2, 2, 'F');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', badgeX + 15, y + 12, { align: 'center' });

  y += 35;

  // ===== FOOTER =====
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, margin + contentWidth, y);
  
  y += 10;
  
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, y, { align: 'center' });
  
  y += 6;
  doc.text('For queries, contact: rajarshidarshan@gmail.com', pageWidth / 2, y, { align: 'center' });
  
  y += 10;
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, y, { align: 'center' });

  // ===== THANK YOU MESSAGE =====
  y += 15;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin + 30, y, contentWidth - 60, 18, 3, 3, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for your payment!', pageWidth / 2, y + 11, { align: 'center' });

  // Save the PDF
  const fileName = `Receipt_${getMonthName(data.month)}_${data.year}_Flat${data.flatNo}.pdf`;
  doc.save(fileName);
};

export default generateReceiptPDF;
