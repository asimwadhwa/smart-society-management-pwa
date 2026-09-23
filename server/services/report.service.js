const mongoose = require('mongoose');

const Maintenance = require('../models/Maintenance');
const Complaint = require('../models/Complaint');
const LiftEmergency = require('../models/LiftEmergency');
const User = require('../models/User');
const Asset = require('../models/Asset');

/**
 * Common society filter
 *
 * societyId:
 *   null = all societies
 *   ObjectId = selected society
 */
const buildSocietyFilter = (societyId) => {
  if (!societyId) {
    return {};
  }

  return {
    society_id: new mongoose.Types.ObjectId(societyId),
  };
};

/* =========================================================
   1. MAINTENANCE REPORT
   ========================================================= */

const getMaintenanceReport = async ({
  societyId = null,
  month = null,
  year = null,
  status = null,
}) => {
  const filter = buildSocietyFilter(societyId);

  if (month) {
    filter.month = Number(month);
  }

  if (year) {
    filter.year = Number(year);
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  const records = await Maintenance.find(filter)
    .populate('user_id', 'name email phone flat_no role')
    .populate('society_id', 'name society_code')
    .sort({
      year: -1,
      month: -1,
      flat_no: 1,
    })
    .lean();

  // Maintenance is normally generated only for these roles
  const validRecords = records.filter(
    (record) =>
      record.user_id &&
      ['resident', 'admin', 'manager'].includes(record.user_id.role)
  );

  let totalExpected = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let totalLateFees = 0;

  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  validRecords.forEach((record) => {
    const amount = Number(record.amount || 0);
    const lateFee = Number(record.late_fee || 0);
    const totalAmount = Number(
      record.total_amount || amount + lateFee
    );

    totalExpected += totalAmount;
    totalLateFees += lateFee;

    if (record.status === 'paid') {
      paidCount++;
      totalCollected += totalAmount;
    } else if (record.status === 'overdue') {
      overdueCount++;
      totalOverdue += totalAmount;
      totalPending += totalAmount;
    } else {
      pendingCount++;
      totalPending += totalAmount;
    }
  });

  // Month-wise summary
  const monthWiseMap = {};

  validRecords.forEach((record) => {
    const key = `${record.year}-${String(record.month).padStart(2, '0')}`;

    if (!monthWiseMap[key]) {
      monthWiseMap[key] = {
        month: record.month,
        year: record.year,
        total_records: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        expected_amount: 0,
        collected_amount: 0,
        pending_amount: 0,
        late_fees: 0,
      };
    }

    const item = monthWiseMap[key];

    const amount = Number(record.amount || 0);
    const lateFee = Number(record.late_fee || 0);
    const totalAmount = Number(
      record.total_amount || amount + lateFee
    );

    item.total_records++;
    item.expected_amount += totalAmount;
    item.late_fees += lateFee;

    if (record.status === 'paid') {
      item.paid++;
      item.collected_amount += totalAmount;
    } else if (record.status === 'overdue') {
      item.overdue++;
      item.pending_amount += totalAmount;
    } else {
      item.pending++;
      item.pending_amount += totalAmount;
    }
  });

  const monthWise = Object.values(monthWiseMap).sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }

    return b.month - a.month;
  });

  return {
    summary: {
      total_records: validRecords.length,

      paid: {
        count: paidCount,
        amount: totalCollected,
      },

      pending: {
        count: pendingCount,
        amount: totalPending,
      },

      overdue: {
        count: overdueCount,
        amount: totalOverdue,
      },

      total_expected: totalExpected,
      total_collected: totalCollected,
      total_pending: totalPending,
      total_late_fees: totalLateFees,
    },

    month_wise: monthWise,

    records: validRecords,
  };
};

/* =========================================================
   2. COMPLAINT REPORT
   ========================================================= */

const getComplaintReport = async ({
  societyId = null,
  status = null,
}) => {
  const filter = buildSocietyFilter(societyId);

  if (status && status !== 'all') {
    filter.status = status;
  }

  const records = await Complaint.find(filter)
    .populate(
      'user_id',
      'name email phone flat_no role'
    )
    .populate(
      'resolved_by',
      'name email role'
    )
    .populate(
      'society_id',
      'name society_code'
    )
    .sort({
      created_at: -1,
    })
    .lean();

  let openCount = 0;
  let inProgressCount = 0;
  let resolvedCount = 0;

  records.forEach((record) => {
    if (record.status === 'open') {
      openCount++;
    } else if (record.status === 'in-progress') {
      inProgressCount++;
    } else if (record.status === 'resolved') {
      resolvedCount++;
    }
  });

  // Resident-wise complaint summary
  const residentMap = {};

  records.forEach((record) => {
    const user = record.user_id;

    if (!user) {
      return;
    }

    const userId = user._id.toString();

    if (!residentMap[userId]) {
      residentMap[userId] = {
        user_id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        flat_no: user.flat_no,
        total_complaints: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
      };
    }

    const item = residentMap[userId];

    item.total_complaints++;

    if (record.status === 'open') {
      item.open++;
    } else if (record.status === 'in-progress') {
      item.in_progress++;
    } else if (record.status === 'resolved') {
      item.resolved++;
    }
  });

  return {
    summary: {
      total_complaints: records.length,
      open: openCount,
      in_progress: inProgressCount,
      resolved: resolvedCount,
    },

    resident_wise: Object.values(residentMap).sort(
      (a, b) => b.total_complaints - a.total_complaints
    ),

    records,
  };
};

/* =========================================================
   3. EMERGENCY REPORT
   ========================================================= */

const getEmergencyReport = async ({
  societyId = null,
  status = null,
}) => {
  const filter = buildSocietyFilter(societyId);

  if (status && status !== 'all') {
    filter.status = status;
  }

  const records = await LiftEmergency.find(filter)
    .populate(
      'triggered_by',
      'name email phone flat_no role'
    )
    .populate(
      'resolved_by',
      'name email role'
    )
    .populate(
      'society_id',
      'name society_code'
    )
    .sort({
      triggered_at: -1,
    })
    .lean();

  let activeCount = 0;
  let resolvedCount = 0;

  records.forEach((record) => {
    if (record.status === 'active') {
      activeCount++;
    } else if (record.status === 'resolved') {
      resolvedCount++;
    }
  });

  return {
    summary: {
      total_emergencies: records.length,
      active: activeCount,
      resolved: resolvedCount,
    },

    records,
  };
};

/* =========================================================
   4. USERS / RESIDENTS REPORT
   ========================================================= */

const getUsersReport = async ({
  societyId = null,
  role = null,
  isActive = null,
}) => {
  const filter = buildSocietyFilter(societyId);

  if (role && role !== 'all') {
    filter.role = role;
  }

  if (isActive !== null && isActive !== undefined && isActive !== '') {
    filter.is_active =
      isActive === true ||
      isActive === 'true';
  }

  // Super admin itself is not a society resident.
  // For society reports, exclude super_admin.
  filter.role = filter.role || {
    $in: ['resident', 'manager', 'admin', 'watchman'],
  };

  const records = await User.find(filter)
    .populate(
      'society_id',
      'name society_code'
    )
    .select(
      'name email phone flat_no role is_active is_verified society_id created_at updated_at'
    )
    .sort({
      role: 1,
      flat_no: 1,
      name: 1,
    })
    .lean();

  let residents = 0;
  let managers = 0;
  let admins = 0;
  let watchmen = 0;
  let active = 0;
  let inactive = 0;

  records.forEach((user) => {
    if (user.role === 'resident') {
      residents++;
    } else if (user.role === 'manager') {
      managers++;
    } else if (user.role === 'admin') {
      admins++;
    } else if (user.role === 'watchman') {
      watchmen++;
    }

    if (user.is_active) {
      active++;
    } else {
      inactive++;
    }
  });

  // Society-wise user summary
  const societyMap = {};

  records.forEach((user) => {
    const society = user.society_id;

    if (!society) {
      return;
    }

    const societyIdKey = society._id.toString();

    if (!societyMap[societyIdKey]) {
      societyMap[societyIdKey] = {
        society_id: society._id,
        society_name: society.name,
        society_code: society.society_code,
        total_users: 0,
        residents: 0,
        managers: 0,
        admins: 0,
        watchmen: 0,
        active: 0,
        inactive: 0,
      };
    }

    const item = societyMap[societyIdKey];

    item.total_users++;

    if (user.role === 'resident') {
      item.residents++;
    } else if (user.role === 'manager') {
      item.managers++;
    } else if (user.role === 'admin') {
      item.admins++;
    } else if (user.role === 'watchman') {
      item.watchmen++;
    }

    if (user.is_active) {
      item.active++;
    } else {
      item.inactive++;
    }
  });

  return {
    summary: {
      total_users: records.length,
      residents,
      managers,
      admins,
      watchmen,
      active,
      inactive,
    },

    society_wise: Object.values(societyMap),

    records,
  };
};

/* =========================================================
   5. ASSETS REPORT
   ========================================================= */

const getAssetsReport = async ({
  societyId = null,
  type = null,
  status = null,
}) => {
  const filter = buildSocietyFilter(societyId);

  if (type && type !== 'all') {
    filter.type = type;
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  const records = await Asset.find(filter)
    .populate(
      'society_id',
      'name society_code'
    )
    .populate(
      'services.done_by',
      'name email role'
    )
    .sort({
      type: 1,
      name: 1,
    })
    .lean();

  let lift = 0;
  let waterPump = 0;
  let generator = 0;

  let working = 0;
  let underMaintenance = 0;
  let notWorking = 0;

  records.forEach((asset) => {
    if (asset.type === 'lift') {
      lift++;
    } else if (asset.type === 'water_pump') {
      waterPump++;
    } else if (asset.type === 'generator') {
      generator++;
    }

    if (asset.status === 'working') {
      working++;
    } else if (asset.status === 'under_maintenance') {
      underMaintenance++;
    } else if (asset.status === 'not_working') {
      notWorking++;
    }
  });

  return {
    summary: {
      total_assets: records.length,

      by_type: {
        lift,
        water_pump: waterPump,
        generator,
      },

      by_status: {
        working,
        under_maintenance: underMaintenance,
        not_working: notWorking,
      },
    },

    records,
  };
};

/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  getMaintenanceReport,
  getComplaintReport,
  getEmergencyReport,
  getUsersReport,
  getAssetsReport,
};