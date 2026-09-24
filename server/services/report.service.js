const mongoose = require('mongoose');

const Maintenance =
  require('../models/Maintenance');

const Complaint =
  require('../models/Complaint');

const LiftEmergency =
  require('../models/LiftEmergency');

const User =
  require('../models/User');

const Asset =
  require('../models/Asset');


// ============================================================
// HELPERS
// ============================================================

const toObjectId = (
  societyId
) => {

  if (!societyId) {
    return null;
  }

  if (
    societyId instanceof
    mongoose.Types.ObjectId
  ) {

    return societyId;

  }

  return new mongoose.Types.ObjectId(
    societyId
  );

};


const numberValue = (
  value
) => {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;

};


// ============================================================
// MAINTENANCE REPORT
// ============================================================

exports.getMaintenanceReport =
  async ({
    societyId,
    month,
    year,
    status
  }) => {

    const filter = {};


    // ----------------------------------------------------------
    // SOCIETY
    // ----------------------------------------------------------

    if (societyId) {

      filter.society_id =
        toObjectId(
          societyId
        );

    }


    // ----------------------------------------------------------
    // MONTH
    // ----------------------------------------------------------

    if (month) {

      const monthNumber =
        parseInt(
          month,
          10
        );

      if (
        monthNumber >= 1 &&
        monthNumber <= 12
      ) {

        filter.month =
          monthNumber;

      }

    }


    // ----------------------------------------------------------
    // YEAR
    // ----------------------------------------------------------

    if (year) {

      const yearNumber =
        parseInt(
          year,
          10
        );

      if (
        yearNumber >= 2000
      ) {

        filter.year =
          yearNumber;

      }

    }


    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (
      [
        'pending',
        'paid',
        'overdue'
      ].includes(status)
    ) {

      filter.status =
        status;

    }


    // ----------------------------------------------------------
    // FETCH
    // ----------------------------------------------------------

    const records =
      await Maintenance.find(
        filter
      )
        .populate(
          'user_id',
          'name email phone flat_no role'
        )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .sort({
          year: -1,
          month: -1,
          due_date: 1
        })
        .lean();


    // ----------------------------------------------------------
    // ONLY RESIDENT / ADMIN / MANAGER
    // ----------------------------------------------------------

    const validRecords =
      records.filter(
        record =>
          !record.user_id?.role ||
          [
            'resident',
            'admin',
            'manager'
          ].includes(
            record.user_id.role
          )
      );


    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------

    let paid = 0;

    let pending = 0;

    let overdue = 0;

    let totalExpected = 0;

    let totalCollected = 0;

    let totalPending = 0;

    let totalOverdue = 0;

    let totalLateFee = 0;


    validRecords.forEach(
      record => {

        const amount =
          numberValue(
            record.amount
          );

        const lateFee =
          numberValue(
            record.late_fee
          );

        const total =
          numberValue(
            record.total_amount
          ) ||
          (
            amount +
            lateFee
          );


        totalExpected +=
          total;


        totalLateFee +=
          lateFee;


        if (
          record.status ===
          'paid'
        ) {

          paid += 1;

          totalCollected +=
            total;

        }


        if (
          record.status ===
          'pending'
        ) {

          pending += 1;

          totalPending +=
            total;

        }


        if (
          record.status ===
          'overdue'
        ) {

          overdue += 1;

          totalOverdue +=
            total;

          totalPending +=
            total;

        }

      }
    );


    return {

      summary: {

        totalRecords:
          validRecords.length,

        paid,

        pending,

        overdue,

        totalExpected,

        totalCollected,

        totalPending,

        totalOverdue,

        totalLateFee

      },

      records:
        validRecords

    };

  };


// ============================================================
// COMPLAINT REPORT
// ============================================================

exports.getComplaintReport =
  async ({
    societyId,
    status
  }) => {

    const filter = {};


    // ----------------------------------------------------------
    // SOCIETY
    // ----------------------------------------------------------

    if (societyId) {

      filter.society_id =
        toObjectId(
          societyId
        );

    }


    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (
      [
        'open',
        'in-progress',
        'resolved'
      ].includes(status)
    ) {

      filter.status =
        status;

    }


    // ----------------------------------------------------------
    // FETCH
    // ----------------------------------------------------------

    const records =
      await Complaint.find(
        filter
      )
        .populate(
          'user_id',
          'name email phone flat_no role'
        )
        .populate(
          'resolved_by',
          'name email phone'
        )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .sort({
          created_at: -1
        })
        .lean();


    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------

    let open = 0;

    let inProgress = 0;

    let resolved = 0;


    records.forEach(
      record => {

        if (
          record.status ===
          'open'
        ) {

          open += 1;

        }


        if (
          record.status ===
          'in-progress'
        ) {

          inProgress += 1;

        }


        if (
          record.status ===
          'resolved'
        ) {

          resolved += 1;

        }

      }
    );


    return {

      summary: {

        total_complaints:
          records.length,

        open,

        in_progress:
          inProgress,

        resolved

      },

      records

    };

  };


// ============================================================
// EMERGENCY REPORT
// ============================================================

exports.getEmergencyReport =
  async ({
    societyId,
    status
  }) => {

    const filter = {};


    // ----------------------------------------------------------
    // SOCIETY
    // ----------------------------------------------------------

    if (societyId) {

      filter.society_id =
        toObjectId(
          societyId
        );

    }


    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (
      [
        'active',
        'resolved'
      ].includes(status)
    ) {

      filter.status =
        status;

    }


    // ----------------------------------------------------------
    // FETCH
    // ----------------------------------------------------------

    const records =
      await LiftEmergency.find(
        filter
      )
        .populate(
          'triggered_by',
          'name email phone flat_no role'
        )
        .populate(
          'resolved_by',
          'name email phone role'
        )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .sort({
          triggered_at: -1
        })
        .lean();


    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------

    let active = 0;

    let resolved = 0;


    records.forEach(
      record => {

        if (
          record.status ===
          'active'
        ) {

          active += 1;

        }


        if (
          record.status ===
          'resolved'
        ) {

          resolved += 1;

        }

      }
    );


    return {

      summary: {

        total_emergencies:
          records.length,

        active,

        resolved

      },

      records

    };

  };


// ============================================================
// USERS / RESIDENTS REPORT
// ============================================================

exports.getUsersReport =
  async ({
    societyId,
    role,
    is_active
  }) => {

    const filter = {};


    // ----------------------------------------------------------
    // SOCIETY
    // ----------------------------------------------------------

    if (societyId) {

      filter.society_id =
        toObjectId(
          societyId
        );

    }


    // ----------------------------------------------------------
    // ROLE
    // ----------------------------------------------------------

    if (
      [
        'resident',
        'manager',
        'admin',
        'watchman'
      ].includes(role)
    ) {

      filter.role =
        role;

    }


    // ----------------------------------------------------------
    // ACTIVE / INACTIVE
    // ----------------------------------------------------------

    if (
      is_active === 'true'
    ) {

      filter.is_active =
        true;

    }


    if (
      is_active === 'false'
    ) {

      filter.is_active =
        false;

    }


    // ----------------------------------------------------------
    // NEVER SHOW SUPER ADMIN
    // ----------------------------------------------------------

    filter.role = filter.role
      ? filter.role
      : {
          $in: [
            'resident',
            'manager',
            'admin',
            'watchman'
          ]
        };


    // ----------------------------------------------------------
    // FETCH
    // ----------------------------------------------------------

    const records =
      await User.find(
        filter
      )
        .select(
          'name email phone flat_no role is_active is_verified society_id created_at updated_at'
        )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .sort({
          role: 1,
          flat_no: 1,
          name: 1
        })
        .lean();


    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------

    let residents = 0;

    let managers = 0;

    let admins = 0;

    let watchmen = 0;

    let active = 0;

    let inactive = 0;


    records.forEach(
      user => {

        switch (
          user.role
        ) {

          case 'resident':
            residents += 1;
            break;

          case 'manager':
            managers += 1;
            break;

          case 'admin':
            admins += 1;
            break;

          case 'watchman':
            watchmen += 1;
            break;

          default:
            break;

        }


        if (
          user.is_active
        ) {

          active += 1;

        } else {

          inactive += 1;

        }

      }
    );


    // ----------------------------------------------------------
    // SOCIETY-WISE SUMMARY
    // ----------------------------------------------------------

    const societyMap =
      new Map();


    records.forEach(
      user => {

        const society =
          user.society_id;


        const id =
          society?._id
            ? String(
                society._id
              )
            : 'unknown';


        if (
          !societyMap.has(id)
        ) {

          societyMap.set(
            id,
            {
              society_id:
                society?._id ||
                null,

              society_name:
                society?.name ||
                'Unknown Society',

              society_code:
                society?.society_code ||
                '',

              total_users: 0,

              residents: 0,

              managers: 0,

              admins: 0,

              watchmen: 0,

              active: 0,

              inactive: 0
            }
          );

        }


        const item =
          societyMap.get(id);


        item.total_users +=
          1;


        if (
          user.role ===
          'resident'
        ) {

          item.residents +=
            1;

        }


        if (
          user.role ===
          'manager'
        ) {

          item.managers +=
            1;

        }


        if (
          user.role ===
          'admin'
        ) {

          item.admins +=
            1;

        }


        if (
          user.role ===
          'watchman'
        ) {

          item.watchmen +=
            1;

        }


        if (
          user.is_active
        ) {

          item.active +=
            1;

        } else {

          item.inactive +=
            1;

        }

      }
    );


    return {

      summary: {

        total_users:
          records.length,

        residents,

        managers,

        admins,

        watchmen,

        active,

        inactive

      },

      society_wise:
        Array.from(
          societyMap.values()
        ),

      records

    };

  };


// ============================================================
// ASSETS REPORT
// ============================================================

exports.getAssetsReport =
  async ({
    societyId,
    type,
    status
  }) => {

    const filter = {};


    // ----------------------------------------------------------
    // SOCIETY
    // ----------------------------------------------------------

    if (societyId) {

      filter.society_id =
        toObjectId(
          societyId
        );

    }


    // ----------------------------------------------------------
    // TYPE
    // ----------------------------------------------------------

    if (
      [
        'lift',
        'water_pump',
        'generator'
      ].includes(type)
    ) {

      filter.type =
        type;

    }


    // ----------------------------------------------------------
    // STATUS
    // ----------------------------------------------------------

    if (
      [
        'working',
        'under_maintenance',
        'not_working'
      ].includes(status)
    ) {

      filter.status =
        status;

    }


    // ----------------------------------------------------------
    // FETCH
    // ----------------------------------------------------------

    let query =
      Asset.find(
        filter
      )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .sort({
          type: 1,
          name: 1
        });


    // ----------------------------------------------------------
    // TRY POPULATING SERVICE USERS
    // ----------------------------------------------------------

    try {

      query =
        query.populate(
          'services.done_by',
          'name email role'
        );

    } catch (error) {

      console.warn(
        'Service user population skipped:',
        error.message
      );

    }


    const records =
      await query.lean();


    // ----------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------

    let working = 0;

    let underMaintenance = 0;

    let notWorking = 0;

    let lifts = 0;

    let waterPumps = 0;

    let generators = 0;


    records.forEach(
      asset => {

        // STATUS

        if (
          asset.status ===
          'working'
        ) {

          working += 1;

        }


        if (
          asset.status ===
          'under_maintenance'
        ) {

          underMaintenance +=
            1;

        }


        if (
          asset.status ===
          'not_working'
        ) {

          notWorking += 1;

        }


        // TYPE

        if (
          asset.type ===
          'lift'
        ) {

          lifts += 1;

        }


        if (
          asset.type ===
          'water_pump'
        ) {

          waterPumps +=
            1;

        }


        if (
          asset.type ===
          'generator'
        ) {

          generators +=
            1;

        }

      }
    );


    // ----------------------------------------------------------
    // SOCIETY-WISE ASSET SUMMARY
    // ----------------------------------------------------------

    const societyMap =
      new Map();


    records.forEach(
      asset => {

        const society =
          asset.society_id;


        const id =
          society?._id
            ? String(
                society._id
              )
            : 'unknown';


        if (
          !societyMap.has(id)
        ) {

          societyMap.set(
            id,
            {
              society_id:
                society?._id ||
                null,

              society_name:
                society?.name ||
                'Unknown Society',

              society_code:
                society?.society_code ||
                '',

              total_assets: 0,

              lifts: 0,

              water_pumps: 0,

              generators: 0,

              working: 0,

              under_maintenance: 0,

              not_working: 0
            }
          );

        }


        const item =
          societyMap.get(id);


        item.total_assets +=
          1;


        if (
          asset.type ===
          'lift'
        ) {

          item.lifts +=
            1;

        }


        if (
          asset.type ===
          'water_pump'
        ) {

          item.water_pumps +=
            1;

        }


        if (
          asset.type ===
          'generator'
        ) {

          item.generators +=
            1;

        }


        if (
          asset.status ===
          'working'
        ) {

          item.working +=
            1;

        }


        if (
          asset.status ===
          'under_maintenance'
        ) {

          item.under_maintenance +=
            1;

        }


        if (
          asset.status ===
          'not_working'
        ) {

          item.not_working +=
            1;

        }

      }
    );


    return {

      summary: {

        total_assets:
          records.length,

        working,

        under_maintenance:
          underMaintenance,

        not_working:
          notWorking,

        lifts,

        water_pumps:
          waterPumps,

        generators,

        by_status: {

          working,

          under_maintenance:
            underMaintenance,

          not_working:
            notWorking

        },

        by_type: {

          lift:
            lifts,

          water_pump:
            waterPumps,

          generator:
            generators

        }

      },

      society_wise:
        Array.from(
          societyMap.values()
        ),

      records

    };

  };