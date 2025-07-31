const express = require("express");
const { supabaseClient } = require("../config/database");
const router = express.Router();

// Create or update attendance (time_in or time_out)
router.post("/create_attendance", async (req, res) => {
  try {
    const { participant_id, event_id } = req.body;

    if (!participant_id || !event_id) {
      return res.status(400).json({ error: "participant_id and event_id are required." });
    }

    // Check if attendance exists today
    const checkQuery = `
      SELECT * FROM rael.attendances
      WHERE participant_id = $1 AND events_id = $2 AND date = CURRENT_DATE
    `;
    const checkResult = await supabaseClient.query(checkQuery, [participant_id, event_id]);
    const existing = checkResult.rows[0];

    // Get current time in Asia/Manila
    const nowQuery = `SELECT TO_CHAR((CURRENT_TIME AT TIME ZONE 'Asia/Manila')::time, 'HH24:MI:SS') AS now`;
    const nowResult = await supabaseClient.query(nowQuery);
    const nowTimeString = nowResult.rows[0].now;

    // Helper: calculate diff in minutes
    function diffMinutes(nowStr, prevStr) {
      const base = '1970-01-01T';
      const now = new Date(`${base}${nowStr}+08:00`);
      const prev = new Date(`${base}${prevStr}+08:00`);
      return Math.floor((now - prev) / 60000);
    }

    let fieldToUpdate = "time_in";

    if (existing) {
      const { time_in, time_out } = existing;

      if (time_in && !time_out) {
        const diff = diffMinutes(nowTimeString, time_in);
        if (diff < 20) {
          return res.status(400).json({ error: `Try again in ${20 - diff} minutes for time out.` });
        }
        fieldToUpdate = "time_out";
      } else if (time_in && time_out) {
        return res.status(400).json({ error: "Attendance for today is already complete." });
      }
    }

    // Insert or update attendance
    const upsertQuery = `
      INSERT INTO rael.attendances (participant_id, events_id, date, ${fieldToUpdate})
      VALUES ($1, $2, CURRENT_DATE, (CURRENT_TIME AT TIME ZONE 'Asia/Manila'))
      ON CONFLICT (participant_id, events_id, date)
      DO UPDATE SET ${fieldToUpdate} = EXCLUDED.${fieldToUpdate}
      RETURNING *;
    `;
    const result = await supabaseClient.query(upsertQuery, [participant_id, event_id]);

    res.status(200).json({
      message: `Successfully recorded ${fieldToUpdate.replace("_", " ")}.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get attendance by participant
router.get("/get_participant_attendance", async (req, res) => {
  const { participant_id } = req.query;

  if (!participant_id) {
    return res.status(400).json({ error: "participant_id is required" });
  }

  try {
    const query = `
      SELECT 
        CONCAT(registration.f_name, ' ', registration.l_name) AS full_name,
        registration.email_address,
        TO_CHAR(attendances.time_in, 'HH12:MI AM') AS time_in,
        TO_CHAR(attendances.time_out, 'HH12:MI AM') AS time_out,
        attendances.date
      FROM rael.attendances
      INNER JOIN rael.registration 
        ON attendances.participant_id = registration.id
      WHERE attendances.participant_id = $1 AND  date = CURRENT_DATE
      ORDER BY attendances.date DESC
    `;
    const result = await supabaseClient.query(query, [participant_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching participant attendance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get full participant attendance report
router.get("/get_participant_full_attendance", async (req, res) => {
  try {
    const query = `
      SELECT 
        TRIM(CONCAT_WS(' ',
        r.f_name,
        CASE
          WHEN r.m_name IS NOT NULL AND r.m_name <> ''
            THEN CONCAT(LEFT(r.m_name, 1), '.')
          ELSE NULL
            END,
            r.l_name,
            r.suffix
        )) AS full_name,
        a.date, 
        r.email_address,
        COALESCE(d.district_name, fd.name) AS district_name,
        COALESCE(s.name, sec.name) AS school_name,
        r.position,
        COALESCE(r.participant_type, 'N/A') AS participant_type,
        TO_CHAR(a.time_in, 'HH12:MI AM') AS time_in,
        TO_CHAR(a.time_out, 'HH12:MI AM') AS time_out,
        a.date
      FROM rael.attendances a
      INNER JOIN rael.registration r ON a.participant_id = r.id
      LEFT JOIN rael.office o ON r.office_id = o.id
      LEFT JOIN rael.functional_division fd ON o.functional_division = fd.id
      LEFT JOIN rael.section sec ON o.section = sec.id
      LEFT JOIN rael.schools s ON r.school = s.school_id
      LEFT JOIN rael.district d ON s.district_id = d.id
      ORDER BY a.date DESC
    `;

    const result = await supabaseClient.query(query);

    const formattedRows = result.rows.map(row => {
      const date = row.date ? new Date(row.date) : null;
      return {
        ...row,
        date: date
          ? date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : ""
      };
    });
    res.status(200).json(formattedRows);
  } catch (error) {
    console.error("Error fetching full attendance report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const query = `DELETE FROM rael.attendances`;
    await supabaseClient.query(query);
    res.status(200).json({ message: "All attendances records deleted successfully." });
  } catch (error) {
    console.error("Error deleting evaluations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
