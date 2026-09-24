import jsPDF from 'jspdf';


// ============================================================
// REPORT TYPES
// ============================================================

export type ReportType =
  | 'maintenance'
  | 'complaints'
  | 'emergency'
  | 'users'
  | 'assets';


// ============================================================
// COMMON TYPES
// ============================================================

interface SocietyInfo {
  name?: string;
  society_code?: string;
}


// ============================================================
// MAINTENANCE
// ============================================================

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

  society_id?: SocietyInfo;
}


// ============================================================
// COMPLAINT
// ============================================================

interface ComplaintReportRecord {
  _id?: string;

  flat_no?: string;

  description?: string;

  status?: string;

  created_at?: string;

  updated_at?: string;

  admin_notes?: string;

  user_id?: {
    name?: string;
    email?: string;
    phone?: string;
    flat_no?: string;
    role?: string;
  };

  resolved_by?: {
    name?: string;
  };

  society_id?: SocietyInfo;
}


// ============================================================
// EMERGENCY
// ============================================================

interface EmergencyReportRecord {
  _id?: string;

  flat_no?: string;

  triggered_at?: string;

  status?: string;

  resolved_at?: string;

  notes?: string;

  triggered_by?: {
    name?: string;
    email?: string;
    phone?: string;
    flat_no?: string;
    role?: string;
  };

  resolved_by?: {
    name?: string;
  };

  society_id?: SocietyInfo;
}


// ============================================================
// USER
// ============================================================

interface UserReportRecord {
  _id?: string;

  name?: string;

  email?: string;

  phone?: string;

  flat_no?: string;

  role?: string;

  is_active?: boolean;

  is_verified?: boolean;

  created_at?: string;

  society_id?: SocietyInfo;

  society?: SocietyInfo;
}


// ============================================================
// ASSET
// ============================================================

interface AssetReportRecord {
  _id?: string;

  name?: string;

  type?: string;

  status?: string;

  location?: string;

  last_service_date?: string;

  services?: Array<{
    date?: string;
    description?: string;
    done_by?: {
      name?: string;
    } | string;
  }>;

  society_id?: SocietyInfo;

  society?: SocietyInfo;
}


// ============================================================
// GENERIC REPORT DATA
// ============================================================

interface GenericReportData {
  summary?: Record<string, any>;

  records?: any[];

  society_id?: string | null;

  all_societies?: boolean;

  society_wise?: any[];

  byStatus?: Record<string, any>;

  by_type?: Record<string, any>;

  by_status?: Record<string, any>;
}


// ============================================================
// PDF OPTIONS
// ============================================================

export interface GenerateReportPDFData {
  reportType: ReportType;

  societyName: string;

  societyCode?: string;

  report: GenericReportData;

  generatedBy?: string;
}


// ============================================================
// OLD MAINTENANCE DATA TYPE
// ============================================================

interface MaintenanceReportData {
  societyName: string;

  societyCode?: string;

  records: MaintenanceReportRecord[];

  generatedBy?: string;

  reportTitle?: string;
}


// ============================================================
// HELPERS
// ============================================================

const getMonthName = (
  month: number
) => {

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

  return (
    months[month - 1] ||
    'Unknown'
  );
};


// ============================================================
// DATE
// ============================================================

const formatDate = (
  date?: string | Date | null
) => {

  if (!date) {
    return '-';
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return '-';
  }

  return parsedDate.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};


// ============================================================
// DATE + TIME
// ============================================================

const formatDateTime = (
  date?: string | Date | null
) => {

  if (!date) {
    return '-';
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return '-';
  }

  return parsedDate.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};


// ============================================================
// AMOUNT
// ============================================================

const formatAmount = (
  amount: number | string
) => {

  return `Rs. ${Number(
    amount || 0
  ).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    }
  )}`;
};


// ============================================================
// TEXT CLEAN
// ============================================================

const cleanText = (
  value: any,
  maxLength = 30
) => {

  const text =
    String(
      value ?? '-'
    );

  if (
    text.length <= maxLength
  ) {
    return text;
  }

  return (
    text.substring(
      0,
      maxLength - 3
    ) + '...'
  );
};


// ============================================================
// STATUS
// ============================================================

const formatStatus = (
  value: any
) => {

  return String(
    value || '-'
  )
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      char =>
        char.toUpperCase()
    );
};


// ============================================================
// NEW PAGE CHECK
// ============================================================

const checkPageSpace = (
  doc: jsPDF,
  y: number,
  requiredSpace = 10
) => {

  const pageHeight =
    doc.internal.pageSize.getHeight();

  if (
    y + requiredSpace >
    pageHeight - 18
  ) {

    doc.addPage();

    return 20;
  }

  return y;
};


// ============================================================
// HEADER
// ============================================================

const addPDFHeader = (
  doc: jsPDF,
  title: string,
  societyName: string,
  societyCode?: string,
  generatedBy?: string
) => {

  const pageWidth =
    doc.internal.pageSize.getWidth();

  // Header background

  doc.setFillColor(
    13,
    148,
    136
  );

  doc.rect(
    0,
    0,
    pageWidth,
    35,
    'F'
  );


  // Society name

  doc.setTextColor(
    255,
    255,
    255
  );

  doc.setFontSize(
    18
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    societyName ||
      'Smart Society Management',
    pageWidth / 2,
    13,
    {
      align: 'center',
    }
  );


  // System name

  doc.setFontSize(
    9
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.text(
    'Society Management System',
    pageWidth / 2,
    20,
    {
      align: 'center',
    }
  );


  // Society code

  if (societyCode) {

    doc.text(
      `Society Code: ${societyCode}`,
      pageWidth / 2,
      28,
      {
        align: 'center',
      }
    );

  }


  // Title

  doc.setTextColor(
    30,
    41,
    59
  );

  doc.setFontSize(
    17
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    title,
    pageWidth / 2,
    48,
    {
      align: 'center',
    }
  );


  // Generated date

  doc.setFontSize(
    8
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setTextColor(
    100,
    116,
    139
  );

  doc.text(
    `Generated on: ${formatDateTime(
      new Date()
    )}`,
    14,
    55
  );


  if (generatedBy) {

    doc.text(
      `Generated by: ${generatedBy}`,
      pageWidth - 14,
      55,
      {
        align: 'right',
      }
    );

  }
};


// ============================================================
// SUMMARY BOX
// ============================================================

const addSummaryBox = (
  doc: jsPDF,
  title: string,
  value: any,
  x: number,
  y: number,
  width = 42
) => {

  doc.setFillColor(
    248,
    250,
    252
  );

  doc.setDrawColor(
    226,
    232,
    240
  );

  doc.roundedRect(
    x,
    y,
    width,
    18,
    2,
    2,
    'FD'
  );


  doc.setFontSize(
    7
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setTextColor(
    100,
    116,
    139
  );

  doc.text(
    title,
    x + 3,
    y + 6
  );


  doc.setFontSize(
    10
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setTextColor(
    15,
    23,
    42
  );

  doc.text(
    String(
      value ?? 0
    ),
    x + 3,
    y + 14
  );
};


// ============================================================
// TABLE HEADER
// ============================================================

const addTableHeader = (
  doc: jsPDF,
  headers: string[],
  widths: number[],
  y: number
) => {

  let x = 10;

  const totalWidth =
    widths.reduce(
      (
        total,
        width
      ) =>
        total + width,
      0
    );


  doc.setFillColor(
    241,
    245,
    249
  );

  doc.rect(
    10,
    y - 5,
    totalWidth,
    9,
    'F'
  );


  doc.setFontSize(
    7
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setTextColor(
    30,
    41,
    59
  );


  headers.forEach(
    (
      header,
      index
    ) => {

      doc.text(
        header,
        x + 2,
        y
      );

      x += widths[index];

    }
  );


  return y + 7;
};


// ============================================================
// FOOTER
// ============================================================

const addPDFFooter = (
  doc: jsPDF
) => {

  const pageCount =
    doc.getNumberOfPages();

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();


  for (
    let page = 1;
    page <= pageCount;
    page++
  ) {

    doc.setPage(
      page
    );


    doc.setDrawColor(
      226,
      232,
      240
    );

    doc.line(
      10,
      pageHeight - 13,
      pageWidth - 10,
      pageHeight - 13
    );


    doc.setFontSize(
      7
    );

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setTextColor(
      100,
      116,
      139
    );


    doc.text(
      'This is a system-generated report.',
      10,
      pageHeight - 7
    );


    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - 10,
      pageHeight - 7,
      {
        align: 'right',
      }
    );

  }
};


// ============================================================
// MAINTENANCE REPORT
// ============================================================

const generateMaintenanceReport = (
  doc: jsPDF,
  report: GenericReportData
) => {

  const records =
    (
      report.records ||
      []
    ) as MaintenanceReportRecord[];


  const summary =
    report.summary ||
    {};


  const paidRecords =
    records.filter(
      record =>
        record.status ===
        'paid'
    );


  const pendingRecords =
    records.filter(
      record =>
        record.status ===
        'pending'
    );


  const overdueRecords =
    records.filter(
      record =>
        record.status ===
        'overdue'
    );


  const totalExpected =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.total_amount ||
          0
        ),
      0
    );


  const totalCollected =
    paidRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.total_amount ||
          0
        ),
      0
    );


  const totalPending =
    pendingRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.total_amount ||
          0
        ),
      0
    );


  const totalOverdue =
    overdueRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.total_amount ||
          0
        ),
      0
    );


  const totalLateFee =
    records.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.late_fee ||
          0
        ),
      0
    );


  let y = 67;


  // Summary

  addSummaryBox(
    doc,
    'Total Records',
    summary.totalRecords ??
      records.length,
    10,
    y
  );


  addSummaryBox(
    doc,
    'Paid',
    summary.paid ??
      paidRecords.length,
    56,
    y
  );


  addSummaryBox(
    doc,
    'Pending',
    summary.pending ??
      pendingRecords.length,
    102,
    y
  );


  addSummaryBox(
    doc,
    'Overdue',
    summary.overdue ??
      overdueRecords.length,
    148,
    y
  );


  addSummaryBox(
    doc,
    'Late Fee',
    formatAmount(
      summary.totalLateFee ??
        totalLateFee
    ),
    194,
    y,
    45
  );


  y += 28;


  // Amount summary

  doc.setFontSize(
    11
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setTextColor(
    30,
    41,
    59
  );

  doc.text(
    'Financial Summary',
    10,
    y
  );


  y += 7;


  doc.setFontSize(
    8
  );

  doc.setFont(
    'helvetica',
    'normal'
  );


  doc.text(
    `Total Expected: ${formatAmount(
      summary.totalExpected ??
        totalExpected
    )}`,
    10,
    y
  );


  doc.text(
    `Total Collected: ${formatAmount(
      summary.totalCollected ??
        totalCollected
    )}`,
    75,
    y
  );


  doc.text(
    `Pending: ${formatAmount(
      summary.totalPending ??
        totalPending
    )}`,
    140,
    y
  );


  doc.text(
    `Overdue: ${formatAmount(
      totalOverdue
    )}`,
    195,
    y
  );


  y += 12;


  // Table

  const headers = [
    'Flat',
    'Resident',
    'Month',
    'Amount',
    'Late Fee',
    'Total',
    'Due Date',
    'Paid Date',
    'Status',
  ];


  const widths = [
    14,
    32,
    22,
    25,
    23,
    25,
    25,
    25,
    27,
  ];


  y = addTableHeader(
    doc,
    headers,
    widths,
    y
  );


  doc.setFont(
    'helvetica',
    'normal'
  );


  records.forEach(
    (
      record
    ) => {

      y =
        checkPageSpace(
          doc,
          y,
          12
        );


      if (
        y === 20
      ) {

        y =
          addTableHeader(
            doc,
            headers,
            widths,
            y
          );

      }


      let x = 10;


      const values = [

        record.flat_no ||
          '-',

        record.user_id?.name ||
          '-',

        `${getMonthName(
          record.month
        )} ${
          record.year
        }`,

        formatAmount(
          record.amount
        ),

        formatAmount(
          record.late_fee
        ),

        formatAmount(
          record.total_amount
        ),

        formatDate(
          record.due_date
        ),

        formatDate(
          record.paid_date
        ),

        formatStatus(
          record.status
        ),

      ];


      values.forEach(
        (
          value,
          index
        ) => {

          doc.setFontSize(
            6.8
          );

          doc.setTextColor(
            30,
            41,
            59
          );


          doc.text(
            cleanText(
              value,
              index === 1
                ? 19
                : 16
            ),
            x + 2,
            y
          );


          x +=
            widths[index];

        }
      );


      doc.setDrawColor(
        226,
        232,
        240
      );


      doc.line(
        10,
        y + 3,
        238,
        y + 3
      );


      y += 8;

    }
  );
};


// ============================================================
// COMPLAINT REPORT
// ============================================================

const generateComplaintReport = (
  doc: jsPDF,
  report: GenericReportData
) => {

  const records =
    (
      report.records ||
      []
    ) as ComplaintReportRecord[];


  const summary =
    report.summary ||
    {};


  let y = 67;


  addSummaryBox(
    doc,
    'Total Complaints',
    summary.total_complaints ??
      records.length,
    10,
    y,
    45
  );


  addSummaryBox(
    doc,
    'Open',
    summary.open ??
      0,
    60,
    y
  );


  addSummaryBox(
    doc,
    'In Progress',
    summary.in_progress ??
      0,
    110,
    y,
    45
  );


  addSummaryBox(
    doc,
    'Resolved',
    summary.resolved ??
      0,
    160,
    y
  );


  y += 30;


  const headers = [
    'Resident',
    'Flat',
    'Description',
    'Date',
    'Status',
    'Admin Notes',
  ];


  const widths = [
    35,
    18,
    65,
    28,
    30,
    52,
  ];


  y = addTableHeader(
    doc,
    headers,
    widths,
    y
  );


  records.forEach(
    record => {

      y =
        checkPageSpace(
          doc,
          y,
          12
        );


      if (
        y === 20
      ) {

        y =
          addTableHeader(
            doc,
            headers,
            widths,
            y
          );

      }


      let x = 10;


      const values = [

        record.user_id?.name ||
          '-',

        record.flat_no ||
          '-',

        record.description ||
          '-',

        formatDate(
          record.created_at
        ),

        formatStatus(
          record.status
        ),

        record.admin_notes ||
          '-',

      ];


      values.forEach(
        (
          value,
          index
        ) => {

          doc.setFontSize(
            6.8
          );

          doc.setTextColor(
            30,
            41,
            59
          );


          doc.text(
            cleanText(
              value,
              index === 2
                ? 38
                : index === 5
                  ? 28
                  : 20
            ),
            x + 2,
            y
          );


          x +=
            widths[index];

        }
      );


      doc.setDrawColor(
        226,
        232,
        240
      );


      doc.line(
        10,
        y + 3,
        238,
        y + 3
      );


      y += 9;

    }
  );
};


// ============================================================
// EMERGENCY REPORT
// ============================================================

const generateEmergencyReport = (
  doc: jsPDF,
  report: GenericReportData
) => {

  const records =
    (
      report.records ||
      []
    ) as EmergencyReportRecord[];


  const summary =
    report.summary ||
    {};


  let y = 67;


  addSummaryBox(
    doc,
    'Total Emergencies',
    summary.total_emergencies ??
      records.length,
    10,
    y,
    48
  );


  addSummaryBox(
    doc,
    'Active',
    summary.active ??
      0,
    63,
    y
  );


  addSummaryBox(
    doc,
    'Resolved',
    summary.resolved ??
      0,
    113,
    y
  );


  y += 30;


  const headers = [
    'Resident',
    'Flat',
    'Triggered',
    'Status',
    'Resolved',
    'Resolution Details',
  ];


  const widths = [
    35,
    18,
    40,
    27,
    40,
    68,
  ];


  y = addTableHeader(
    doc,
    headers,
    widths,
    y
  );


  records.forEach(
    record => {

      y =
        checkPageSpace(
          doc,
          y,
          12
        );


      if (
        y === 20
      ) {

        y =
          addTableHeader(
            doc,
            headers,
            widths,
            y
          );

      }


      let x = 10;


      const values = [

        record.triggered_by?.name ||
          '-',

        record.flat_no ||
          '-',

        formatDateTime(
          record.triggered_at
        ),

        formatStatus(
          record.status
        ),

        formatDateTime(
          record.resolved_at
        ),

        record.notes ||
          '-',

      ];


      values.forEach(
        (
          value,
          index
        ) => {

          doc.setFontSize(
            6.8
          );

          doc.setTextColor(
            30,
            41,
            59
          );


          doc.text(
            cleanText(
              value,
              index === 5
                ? 40
                : 22
            ),
            x + 2,
            y
          );


          x +=
            widths[index];

        }
      );


      doc.setDrawColor(
        226,
        232,
        240
      );


      doc.line(
        10,
        y + 3,
        238,
        y + 3
      );


      y += 9;

    }
  );
};


// ============================================================
// USERS / RESIDENTS REPORT
// ============================================================

const generateUsersReport = (
  doc: jsPDF,
  report: GenericReportData
) => {

  const records =
    (
      report.records ||
      []
    ) as UserReportRecord[];


  const summary =
    report.summary ||
    {};


  let y = 67;


  addSummaryBox(
    doc,
    'Total Users',
    summary.total_users ??
      records.length,
    10,
    y
  );


  addSummaryBox(
    doc,
    'Residents',
    summary.residents ??
      0,
    55,
    y
  );


  addSummaryBox(
    doc,
    'Managers',
    summary.managers ??
      0,
    100,
    y
  );


  addSummaryBox(
    doc,
    'Admins',
    summary.admins ??
      0,
    145,
    y
  );


  addSummaryBox(
    doc,
    'Active',
    summary.active ??
      0,
    190,
    y
  );


  y += 28;


  addSummaryBox(
    doc,
    'Inactive',
    summary.inactive ??
      0,
    10,
    y
  );


  addSummaryBox(
    doc,
    'Watchmen',
    summary.watchmen ??
      0,
    55,
    y
  );


  y += 28;


  const headers = [
    'Name',
    'Email',
    'Phone',
    'Flat',
    'Role',
    'Status',
    'Society',
  ];


  const widths = [
    30,
    42,
    30,
    17,
    25,
    25,
    61,
  ];


  y = addTableHeader(
    doc,
    headers,
    widths,
    y
  );


  records.forEach(
    record => {

      y =
        checkPageSpace(
          doc,
          y,
          12
        );


      if (
        y === 20
      ) {

        y =
          addTableHeader(
            doc,
            headers,
            widths,
            y
          );

      }


      let x = 10;


      const societyName =
        record.society_id?.name ||
        record.society?.name ||
        '-';


      const values = [

        record.name ||
          '-',

        record.email ||
          '-',

        record.phone ||
          '-',

        record.flat_no ||
          '-',

        record.role ||
          '-',

        record.is_active
          ? 'Active'
          : 'Inactive',

        societyName,

      ];


      values.forEach(
        (
          value,
          index
        ) => {

          doc.setFontSize(
            6.8
          );

          doc.setTextColor(
            30,
            41,
            59
          );


          doc.text(
            cleanText(
              value,
              index === 1
                ? 24
                : index === 6
                  ? 28
                  : 18
            ),
            x + 2,
            y
          );


          x +=
            widths[index];

        }
      );


      doc.setDrawColor(
        226,
        232,
        240
      );


      doc.line(
        10,
        y + 3,
        240,
        y + 3
      );


      y += 9;

    }
  );
};


// ============================================================
// ASSETS REPORT
// ============================================================

const generateAssetsReport = (
  doc: jsPDF,
  report: GenericReportData
) => {

  const records =
    (
      report.records ||
      []
    ) as AssetReportRecord[];


  const summary =
    report.summary ||
    {};


  const byStatus =
    summary.by_status ||
    summary.byStatus ||
    {};


  let y = 67;


  addSummaryBox(
    doc,
    'Total Assets',
    summary.total_assets ??
      records.length,
    10,
    y,
    45
  );


  addSummaryBox(
    doc,
    'Working',
    summary.working ??
      byStatus.working ??
      0,
    60,
    y
  );


  addSummaryBox(
    doc,
    'Maintenance',
    summary.under_maintenance ??
      byStatus.under_maintenance ??
      0,
    110,
    y,
    48
  );


  addSummaryBox(
    doc,
    'Not Working',
    summary.not_working ??
      byStatus.not_working ??
      0,
    163,
    y,
    45
  );


  y += 30;


  const headers = [
    'Asset',
    'Type',
    'Status',
    'Location',
    'Last Service',
    'Services',
    'Society',
  ];


  const widths = [
    35,
    30,
    34,
    45,
    32,
    20,
    44,
  ];


  y = addTableHeader(
    doc,
    headers,
    widths,
    y
  );


  records.forEach(
    record => {

      y =
        checkPageSpace(
          doc,
          y,
          12
        );


      if (
        y === 20
      ) {

        y =
          addTableHeader(
            doc,
            headers,
            widths,
            y
          );

      }


      let x = 10;


      const societyName =
        record.society_id?.name ||
        record.society?.name ||
        '-';


      const serviceCount =
        Array.isArray(
          record.services
        )
          ? record.services.length
          : 0;


      const values = [

        record.name ||
          '-',

        String(
          record.type ||
            '-'
        ).replaceAll(
          '_',
          ' '
        ),

        formatStatus(
          record.status
        ),

        record.location ||
          '-',

        formatDate(
          record.last_service_date
        ),

        serviceCount,

        societyName,

      ];


      values.forEach(
        (
          value,
          index
        ) => {

          doc.setFontSize(
            6.8
          );

          doc.setTextColor(
            30,
            41,
            59
          );


          doc.text(
            cleanText(
              value,
              index === 3
                ? 25
                : index === 6
                  ? 22
                  : 18
            ),
            x + 2,
            y
          );


          x +=
            widths[index];

        }
      );


      doc.setDrawColor(
        226,
        232,
        240
      );


      doc.line(
        10,
        y + 3,
        240,
        y + 3
      );


      y += 9;

    }
  );
};


// ============================================================
// MAIN REPORT GENERATOR
// ============================================================

export const generateReportPDF = ({
  reportType,
  societyName,
  societyCode,
  report,
  generatedBy,
}: GenerateReportPDFData) => {

  /*
   * Landscape A4 is used because
   * reports contain multiple columns.
   */

  const doc =
    new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });


  const titles: Record<
    ReportType,
    string
  > = {

    maintenance:
      'Maintenance Report',

    complaints:
      'Complaint Report',

    emergency:
      'Emergency Report',

    users:
      'Users / Residents Report',

    assets:
      'Assets Report',

  };


  addPDFHeader(
    doc,
    titles[reportType],
    societyName,
    societyCode,
    generatedBy
  );


  // ==========================================================
  // REPORT TYPE
  // ==========================================================

  switch (
    reportType
  ) {

    case 'maintenance':

      generateMaintenanceReport(
        doc,
        report
      );

      break;


    case 'complaints':

      generateComplaintReport(
        doc,
        report
      );

      break;


    case 'emergency':

      generateEmergencyReport(
        doc,
        report
      );

      break;


    case 'users':

      generateUsersReport(
        doc,
        report
      );

      break;


    case 'assets':

      generateAssetsReport(
        doc,
        report
      );

      break;


    default:

      throw new Error(
        'Invalid report type.'
      );

  }


  // ==========================================================
  // FOOTER
  // ==========================================================

  addPDFFooter(
    doc
  );


  // ==========================================================
  // FILE NAME
  // ==========================================================

  const safeSocietyName =
    String(
      societyName ||
        'All_Societies'
    )
      .replace(
        /[^a-zA-Z0-9-_]/g,
        '_'
      );


  const safeReportType =
    String(
      reportType
    )
      .replace(
        /[^a-zA-Z0-9-_]/g,
        '_'
      );


  const fileName =
    `${safeReportType}_Report_${safeSocietyName}.pdf`;


  doc.save(
    fileName
  );
};


// ============================================================
// MAINTENANCE-ONLY FUNCTION
// ============================================================
// This keeps compatibility with your old code.
// If any other page is still using
// generateMaintenanceReportPDF(), it will continue working.
// ============================================================

export const generateMaintenanceReportPDF = (
  data: MaintenanceReportData
) => {

  const report: GenericReportData = {

    records:
      data.records || [],

  };


  generateReportPDF({

    reportType:
      'maintenance',

    societyName:
      data.societyName,

    societyCode:
      data.societyCode,

    generatedBy:
      data.generatedBy,

    report,

  });

};