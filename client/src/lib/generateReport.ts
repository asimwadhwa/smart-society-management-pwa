import jsPDF from 'jspdf';

interface MaintenanceReportRecord {
  _id?: string;
  month: number;
  year: number;
  flat_no: string;
  amount: number;
  late_fee: number;
  total_amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  razorpay_payment_id?: string;
  user_id?: {
    name?: string;
    email?: string;
    phone?: string;
    flat_no?: string;
    role?: string;
  };
  society_id?: {
    name?: string;
    society_code?: string;
  };
}

interface MaintenanceReportData {
  societyName: string;
  societyCode?: string;
  records: MaintenanceReportRecord[];
  generatedBy?: string;
  reportTitle?: string;
}

const getMonthName = (month: number) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return months[month - 1] || 'Unknown';
};

const formatDate = (date?: string) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatAmount = (amount: number) => {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
};

export const generateMaintenanceReportPDF = (
  data: MaintenanceReportData
) => {
  const doc = new jsPDF();

  const records = data.records || [];

  const totalRecords = records.length;

  const paidRecords = records.filter(
    record => record.status === 'paid'
  );

  const pendingRecords = records.filter(
    record => record.status === 'pending'
  );

  const overdueRecords = records.filter(
    record => record.status === 'overdue'
  );

  const totalExpected = records.reduce(
    (total, record) =>
      total + Number(record.total_amount || 0),
    0
  );

  const totalCollected = paidRecords.reduce(
    (total, record) =>
      total + Number(record.total_amount || 0),
    0
  );

  const totalPending = pendingRecords.reduce(
    (total, record) =>
      total + Number(record.total_amount || 0),
    0
  );

  const totalOverdue = overdueRecords.reduce(
    (total, record) =>
      total + Number(record.total_amount || 0),
    0
  );

  const totalLateFee = records.reduce(
    (total, record) =>
      total + Number(record.late_fee || 0),
    0
  );

  // ==========================================================
  // HEADER
  // ==========================================================

  doc.setFillColor(13, 148, 136);

  doc.rect(
    0,
    0,
    210,
    35,
    'F'
  );

  doc.setTextColor(255, 255, 255);

  doc.setFontSize(20);

  doc.setFont('helvetica', 'bold');

  doc.text(
    data.societyName || 'Smart Society Management',
    105,
    14,
    {
      align: 'center',
    }
  );

  doc.setFontSize(11);

  doc.setFont('helvetica', 'normal');

  doc.text(
    'Society Management System',
    105,
    22,
    {
      align: 'center',
    }
  );

  doc.text(
    data.societyCode
      ? `Society Code: ${data.societyCode}`
      : '',
    105,
    29,
    {
      align: 'center',
    }
  );

  // ==========================================================
  // TITLE
  // ==========================================================

  doc.setTextColor(30, 41, 59);

  doc.setFontSize(17);

  doc.setFont('helvetica', 'bold');

  doc.text(
    data.reportTitle || 'Maintenance Report',
    105,
    48,
    {
      align: 'center',
    }
  );

  doc.setFontSize(9);

  doc.setFont('helvetica', 'normal');

  doc.setTextColor(100, 116, 139);

  doc.text(
    `Generated on: ${formatDate(
      new Date().toISOString()
    )}`,
    105,
    55,
    {
      align: 'center',
    }
  );

  // ==========================================================
  // SUMMARY
  // ==========================================================

  let y = 68;

  doc.setTextColor(30, 41, 59);

  doc.setFontSize(13);

  doc.setFont('helvetica', 'bold');

  doc.text(
    'Summary',
    14,
    y
  );

  y += 8;

  doc.setFontSize(10);

  doc.setFont('helvetica', 'normal');

  doc.text(
    `Total Records: ${totalRecords}`,
    14,
    y
  );

  doc.text(
    `Total Expected: ${formatAmount(totalExpected)}`,
    110,
    y
  );

  y += 7;

  doc.text(
    `Paid: ${paidRecords.length}`,
    14,
    y
  );

  doc.text(
    `Collected: ${formatAmount(totalCollected)}`,
    110,
    y
  );

  y += 7;

  doc.text(
    `Pending: ${pendingRecords.length}`,
    14,
    y
  );

  doc.text(
    `Pending Amount: ${formatAmount(totalPending)}`,
    110,
    y
  );

  y += 7;

  doc.text(
    `Overdue: ${overdueRecords.length}`,
    14,
    y
  );

  doc.text(
    `Overdue Amount: ${formatAmount(totalOverdue)}`,
    110,
    y
  );

  y += 7;

  doc.text(
    `Total Late Fee: ${formatAmount(totalLateFee)}`,
    14,
    y
  );

  // ==========================================================
  // DETAIL SECTION
  // ==========================================================

  y += 12;

  doc.setFontSize(13);

  doc.setFont('helvetica', 'bold');

  doc.setTextColor(30, 41, 59);

  doc.text(
    'Maintenance Details',
    14,
    y
  );

  y += 8;

  // Table header

  doc.setFillColor(241, 245, 249);

  doc.rect(
    10,
    y - 5,
    190,
    9,
    'F'
  );

  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');

  doc.setTextColor(30, 41, 59);

  doc.text('Flat', 12, y);

  doc.text('Resident', 30, y);

  doc.text('Month', 70, y);

  doc.text('Amount', 100, y);

  doc.text('Status', 125, y);

  doc.text('Due Date', 150, y);

  doc.text('Paid Date', 177, y);

  y += 7;

  doc.setFont('helvetica', 'normal');

  // ==========================================================
  // RECORDS
  // ==========================================================

  records.forEach((record, index) => {

    if (y > 275) {
      doc.addPage();

      y = 20;

      doc.setFontSize(13);

      doc.setFont('helvetica', 'bold');

      doc.text(
        'Maintenance Details - Continued',
        14,
        y
      );

      y += 10;

      doc.setFontSize(8);

      doc.setFont('helvetica', 'normal');
    }

    const residentName =
      record.user_id?.name ||
      '-';

    const month =
      `${getMonthName(record.month)} ${record.year}`;

    doc.setFontSize(7.5);

    doc.text(
      record.flat_no || '-',
      12,
      y
    );

    doc.text(
      residentName.substring(0, 20),
      30,
      y
    );

    doc.text(
      month.substring(0, 17),
      70,
      y
    );

    doc.text(
      formatAmount(record.total_amount),
      100,
      y
    );

    doc.text(
      record.status.toUpperCase(),
      125,
      y
    );

    doc.text(
      formatDate(record.due_date),
      150,
      y
    );

    doc.text(
      formatDate(record.paid_date),
      177,
      y
    );

    y += 7;

    // Extra transaction information

    if (record.status === 'paid') {

      doc.setFontSize(7);

      doc.setTextColor(100, 116, 139);

      doc.text(
        `Transaction ID: ${
          record.razorpay_payment_id || '-'
        }`,
        30,
        y
      );

      y += 6;

      doc.setTextColor(30, 41, 59);
    }

    if (index < records.length - 1) {

      doc.setDrawColor(226, 232, 240);

      doc.line(
        10,
        y - 3,
        200,
        y - 3
      );
    }
  });

  // ==========================================================
  // FOOTER
  // ==========================================================

  const pageCount =
    doc.getNumberOfPages();

  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {

    doc.setPage(page);

    doc.setFontSize(8);

    doc.setTextColor(100, 116, 139);

    doc.text(
      'This is a system-generated report.',
      105,
      287,
      {
        align: 'center',
      }
    );

    doc.text(
      `Page ${page} of ${pageCount}`,
      105,
      293,
      {
        align: 'center',
      }
    );
  }

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  const safeSocietyName =
    (
      data.societyName ||
      'Smart_Society'
    )
      .replace(
        /[^a-zA-Z0-9-_]/g,
        '_'
      );

  doc.save(
    `Maintenance_Report_${safeSocietyName}.pdf`
  );
};