import * as svc from "../services/registrationService.js";
import ExcelJS from "exceljs";

// POST /api/registrations/:eventId/register
export const registerForEvent = async (req, res, next) => {
  try {
    const result = await svc.registerForEvent({
      eventId: req.params.eventId,
      studentId: req.user.id,
    });
    res.status(201).json({ success: true, message: "Registered successfully.", data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/:eventId/my
export const getMyRegistration = async (req, res, next) => {
  try {
    const reg = await svc.getMyRegistration({
      eventId: req.params.eventId,
      studentId: req.user.id,
    });
    res.json({ success: true, data: reg });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/:eventId/qr-pass
export const getQRPass = async (req, res, next) => {
  try {
    const data = await svc.getQRPass({
      eventId: req.params.eventId,
      studentId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// POST /api/registrations/:eventId/verify-qr
export const verifyQR = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "QR token is required." });
    }
    const result = await svc.verifyAndMarkAttendance({
      token,
      eventId: req.params.eventId,
      organizerId: req.user.id,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/:eventId/attendance/stats
export const getAttendanceStats = async (req, res, next) => {
  try {
    const stats = await svc.getAttendanceStats({
      eventId: req.params.eventId,
      organizerId: req.user.id,
    });
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/:eventId/attendance/list
export const getAttendanceList = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;
    const result = await svc.getRegistrationsList({
      eventId: req.params.eventId,
      organizerId: req.user.id,
      page,
      limit,
      search,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/:eventId/report/csv
export const downloadCSV = async (req, res, next) => {
  try {
    const report = await svc.generateReportData({
      eventId: req.params.eventId,
      organizerId: req.user.id,
    });

    const escape = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Prevent formula injection
      const safe = str.replace(/^[=+\-@\t\r]/, "'$&");
      if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
        return `"${safe.replace(/"/g, '""')}"`;
      }
      return safe;
    };

    const headers = [
      "Registration ID",
      "Student Name",
      "Roll Number",
      "Email",
      "Registration Status",
      "Registered At",
      "Attendance Status",
      "Checked In At",
    ];

    const lines = [
      `# Event: ${escape(report.event.title)}`,
      `# Date: ${new Date(report.event.start_date).toLocaleDateString()}`,
      `# Venue: ${escape(report.event.venue)}`,
      `# Generated: ${new Date(report.generated_at).toISOString()}`,
      `# Confirmed: ${report.summary.confirmed} | Present: ${report.summary.present} | Absent: ${report.summary.absent} | Cancelled: ${report.summary.cancelled} | Attendance: ${report.summary.percentage}%`,
      "",
      headers.map(escape).join(","),
      ...report.rows.map((r) =>
        [
          r.registration_id,
          r.student_name,
          r.roll_number,
          r.email,
          r.registration_status,
          r.registered_at ? new Date(r.registered_at).toISOString() : "",
          r.attendance_status,
          r.checked_in_at ? new Date(r.checked_in_at).toISOString() : "",
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const csv = lines.join("\r\n");
    const filename = `attendance_${report.event.event_id || req.params.eventId}_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csv); // BOM for Excel UTF-8 compatibility
  } catch (err) {
    next(err);
  }
};

// GET /api/registrations/:eventId/report/xlsx
export const downloadXLSX = async (req, res, next) => {
  try {
    const report = await svc.generateReportData({
      eventId: req.params.eventId,
      organizerId: req.user.id,
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "CampusConnect";
    wb.created = new Date();

    const ws = wb.addWorksheet("Attendance");

    // Summary block
    ws.addRow(["Event", report.event.title]);
    ws.addRow(["Date", new Date(report.event.start_date).toLocaleDateString()]);
    ws.addRow(["Venue", report.event.venue]);
    ws.addRow(["Generated", new Date(report.generated_at).toLocaleString()]);
    ws.addRow([]);
    ws.addRow(["Confirmed", report.summary.confirmed, "Present", report.summary.present, "Absent", report.summary.absent, "Attendance %", `${report.summary.percentage}%`]);
    ws.addRow([]);

    // Header row
    const headerRow = ws.addRow([
      "Registration ID",
      "Student Name",
      "Roll Number",
      "Email",
      "Registration Status",
      "Registered At",
      "Attendance Status",
      "Checked In At",
    ]);
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD8E1EE" } };

    // Data rows
    report.rows.forEach((r) => {
      const row = ws.addRow([
        r.registration_id,
        r.student_name,
        r.roll_number,
        r.email,
        r.registration_status,
        r.registered_at ? new Date(r.registered_at).toLocaleString() : "",
        r.attendance_status,
        r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : "",
      ]);
      // Colour-code attendance
      const attCell = row.getCell(7);
      if (r.attendance_status === "Present") {
        attCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F0EB" } };
      } else if (r.attendance_status === "Absent") {
        attCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8E9EA" } };
      }
    });

    // Auto-width
    ws.columns.forEach((col) => {
      let max = 12;
      col.eachCell({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 2, 50);
    });

    const filename = `attendance_${report.event.event_id || req.params.eventId}_${Date.now()}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
