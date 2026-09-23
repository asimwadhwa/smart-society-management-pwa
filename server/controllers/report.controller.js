const mongoose = require('mongoose');

const {
  getMaintenanceReport,
  getComplaintReport,
  getEmergencyReport,
  getUsersReport,
  getAssetsReport,
} = require('../services/report.service');

/* =========================================================
   COMMON HELPERS
   ========================================================= */

const isSuperAdmin = (req) => {
  return req.user?.role === 'super_admin';
};

const isManagerOrAdmin = (req) => {
  return ['manager', 'admin'].includes(req.user?.role);
};

const getUserSocietyId = (req) => {
  return req.user?.society_id || null;
};

/**
 * Gets the society that the report is allowed to access.
 *
 * Super Admin:
 *   - society_id provided -> selected society
 *   - society_id missing   -> all societies
 *
 * Manager/Admin:
 *   - ALWAYS own society
 *   - frontend cannot override this
 */
const getReportSocietyId = (req) => {
  if (isSuperAdmin(req)) {
    const societyId = req.query.society_id;

    if (!societyId || societyId === 'all') {
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(societyId)) {
      const error = new Error('Invalid society_id');
      error.statusCode = 400;
      throw error;
    }

    return societyId;
  }

  if (isManagerOrAdmin(req)) {
    const societyId = getUserSocietyId(req);

    if (!societyId) {
      const error = new Error(
        'User is not assigned to any society'
      );

      error.statusCode = 403;
      throw error;
    }

    return societyId.toString();
  }

  const error = new Error(
    'You are not authorized to access reports'
  );

  error.statusCode = 403;
  throw error;
};

/**
 * Common response metadata.
 */
const getReportMeta = (req, societyId) => {
  return {
    society_id: societyId,
    all_societies:
      isSuperAdmin(req) && !societyId,
  };
};

/* =========================================================
   1. MAINTENANCE REPORT
   ========================================================= */

const getMaintenanceReportController = async (req, res) => {
  try {
    const societyId = getReportSocietyId(req);

    const {
      month,
      year,
      status,
    } = req.query;

    const report = await getMaintenanceReport({
      societyId,
      month,
      year,
      status,
    });

    return res.status(200).json({
      success: true,

      data: {
        ...report,

        ...getReportMeta(req, societyId),
      },
    });
  } catch (error) {
    console.error(
      'Maintenance report error:',
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Failed to generate maintenance report',
    });
  }
};

/* =========================================================
   2. COMPLAINT REPORT
   ========================================================= */

const getComplaintReportController = async (req, res) => {
  try {
    const societyId = getReportSocietyId(req);

    const {
      status,
    } = req.query;

    const report = await getComplaintReport({
      societyId,
      status,
    });

    return res.status(200).json({
      success: true,

      data: {
        ...report,

        ...getReportMeta(req, societyId),
      },
    });
  } catch (error) {
    console.error(
      'Complaint report error:',
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Failed to generate complaint report',
    });
  }
};

/* =========================================================
   3. EMERGENCY REPORT
   ========================================================= */

const getEmergencyReportController = async (req, res) => {
  try {
    const societyId = getReportSocietyId(req);

    const {
      status,
    } = req.query;

    const report = await getEmergencyReport({
      societyId,
      status,
    });

    return res.status(200).json({
      success: true,

      data: {
        ...report,

        ...getReportMeta(req, societyId),
      },
    });
  } catch (error) {
    console.error(
      'Emergency report error:',
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Failed to generate emergency report',
    });
  }
};

/* =========================================================
   4. USERS / RESIDENTS REPORT
   ========================================================= */

const getUsersReportController = async (req, res) => {
  try {
    const societyId = getReportSocietyId(req);

    const {
      role,
      is_active,
    } = req.query;

    const report = await getUsersReport({
      societyId,
      role,
      isActive: is_active,
    });

    return res.status(200).json({
      success: true,

      data: {
        ...report,

        ...getReportMeta(req, societyId),
      },
    });
  } catch (error) {
    console.error(
      'Users report error:',
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Failed to generate users report',
    });
  }
};

/* =========================================================
   5. ASSETS REPORT
   ========================================================= */

const getAssetsReportController = async (req, res) => {
  try {
    const societyId = getReportSocietyId(req);

    const {
      type,
      status,
    } = req.query;

    const report = await getAssetsReport({
      societyId,
      type,
      status,
    });

    return res.status(200).json({
      success: true,

      data: {
        ...report,

        ...getReportMeta(req, societyId),
      },
    });
  } catch (error) {
    console.error(
      'Assets report error:',
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        'Failed to generate assets report',
    });
  }
};

/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  getMaintenanceReport:
    getMaintenanceReportController,

  getComplaintReport:
    getComplaintReportController,

  getEmergencyReport:
    getEmergencyReportController,

  getUsersReport:
    getUsersReportController,

  getAssetsReport:
    getAssetsReportController,
};