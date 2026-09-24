const mongoose = require('mongoose');

const reportService =
  require('../services/report.service');


// ============================================================
// HELPERS
// ============================================================

const isSuperAdmin = (req) => {
  return req.user?.role === 'super_admin';
};


const isManagerOrAdmin = (req) => {
  return [
    'manager',
    'admin'
  ].includes(
    req.user?.role
  );
};


const getOwnSocietyId = (req) => {
  return req.user?.society_id || null;
};


const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ============================================================
// GET EFFECTIVE SOCIETY
// ============================================================
//
// SUPER ADMIN
// -> society_id supplied = selected society
// -> no society_id = all societies
//
// MANAGER / ADMIN
// -> ALWAYS own society
// -> frontend cannot override it
//
// ============================================================

const getEffectiveSocietyId = (
  req,
  requestedSocietyId
) => {

  if (isSuperAdmin(req)) {

    if (
      requestedSocietyId &&
      requestedSocietyId !== 'all'
    ) {

      if (
        !isValidObjectId(
          requestedSocietyId
        )
      ) {

        const error =
          new Error(
            'Invalid society ID'
          );

        error.statusCode = 400;

        throw error;
      }

      return requestedSocietyId;
    }

    return null;
  }


  const ownSocietyId =
    getOwnSocietyId(req);


  if (!ownSocietyId) {

    const error =
      new Error(
        'User is not assigned to any society'
      );

    error.statusCode = 400;

    throw error;
  }


  return ownSocietyId;
};


// ============================================================
// COMMON SUCCESS RESPONSE
// ============================================================

const sendReportResponse = (
  req,
  res,
  data,
  societyId
) => {

  return res.status(200).json({

    success: true,

    data: {

      ...data,

      society_id:
        societyId || null,

      all_societies:
        isSuperAdmin(req) &&
        !societyId

    }

  });

};


// ============================================================
// MAINTENANCE REPORT
// ============================================================

exports.getMaintenanceReport =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        society_id,
        month,
        year,
        status
      } = req.query;


      const effectiveSocietyId =
        getEffectiveSocietyId(
          req,
          society_id
        );


      const report =
        await reportService.getMaintenanceReport({

          societyId:
            effectiveSocietyId,

          month,

          year,

          status

        });


      return sendReportResponse(
        req,
        res,
        report,
        effectiveSocietyId
      );

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
          'Failed to generate maintenance report.'

      });

    }

  };


// ============================================================
// COMPLAINT REPORT
// ============================================================

exports.getComplaintReport =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        society_id,
        status
      } = req.query;


      const effectiveSocietyId =
        getEffectiveSocietyId(
          req,
          society_id
        );


      const report =
        await reportService.getComplaintReport({

          societyId:
            effectiveSocietyId,

          status

        });


      return sendReportResponse(
        req,
        res,
        report,
        effectiveSocietyId
      );

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
          'Failed to generate complaint report.'

      });

    }

  };


// ============================================================
// EMERGENCY REPORT
// ============================================================

exports.getEmergencyReport =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        society_id,
        status
      } = req.query;


      const effectiveSocietyId =
        getEffectiveSocietyId(
          req,
          society_id
        );


      const report =
        await reportService.getEmergencyReport({

          societyId:
            effectiveSocietyId,

          status

        });


      return sendReportResponse(
        req,
        res,
        report,
        effectiveSocietyId
      );

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
          'Failed to generate emergency report.'

      });

    }

  };


// ============================================================
// USERS REPORT
// ============================================================

exports.getUsersReport =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        society_id,
        role,
        is_active
      } = req.query;


      const effectiveSocietyId =
        getEffectiveSocietyId(
          req,
          society_id
        );


      const report =
        await reportService.getUsersReport({

          societyId:
            effectiveSocietyId,

          role,

          is_active

        });


      return sendReportResponse(
        req,
        res,
        report,
        effectiveSocietyId
      );

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
          'Failed to generate users report.'

      });

    }

  };


// ============================================================
// ASSETS REPORT
// ============================================================

exports.getAssetsReport =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        society_id,
        type,
        status
      } = req.query;


      const effectiveSocietyId =
        getEffectiveSocietyId(
          req,
          society_id
        );


      const report =
        await reportService.getAssetsReport({

          societyId:
            effectiveSocietyId,

          type,

          status

        });


      return sendReportResponse(
        req,
        res,
        report,
        effectiveSocietyId
      );

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
          'Failed to generate assets report.'

      });

    }

  };