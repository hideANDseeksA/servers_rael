const express = require('express');
const { supabaseClient,supabasePool } = require('../config/database');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
const path = require('path');
const mime = require('mime-types');



const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Accept two file fields: 'or_receipt' and 'participant_image'

router.post("/creates", upload.fields([
  { name: 'or_receipt', maxCount: 1 },
  { name: 'participant_image', maxCount: 1 }
]), async (req, res) => {
  const registration = req.body;

  // Validate email
  if (registration.email_address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email_address)) {
    return res.status(400).json({ error: "Invalid email address format." });
  }

  try {
    let orReceiptUrl = null;
    let participantImageUrl = null;

    // Handle OR receipt upload
    if (req.files?.or_receipt?.[0]) {
      const file = req.files.or_receipt[0];
      const fileExt = file.originalname.split('.').pop();
      const fileName = `receipt_${Date.now()}.${fileExt}`;
      const filePath = `receipt/${fileName}`;
      const fileBuffer = fs.readFileSync(file.path);

      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      fs.unlinkSync(file.path);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('image').getPublicUrl(filePath);
      orReceiptUrl = data.publicUrl;
    }

    // Handle participant image upload
    if (req.files?.participant_image?.[0]) {
      const file = req.files.participant_image[0];
      const fileExt = file.originalname.split('.').pop();
      const fileName = `participant_${Date.now()}.${fileExt}`;
      const filePath = `participant/${fileName}`;
      const fileBuffer = fs.readFileSync(file.path);

      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      fs.unlinkSync(file.path);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('image').getPublicUrl(filePath);
      participantImageUrl = data.publicUrl;
    }

    const query = `
      INSERT INTO rael.registration 
      (f_name,m_name,l_name,suffix, email_address, school, t_shirt_size, payment_date, phone_number, or_receipt_url,
       participant_image_url, position, food_restriction,  event_id, office_id, participant_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11, $12, $13,$14,$15,$16) RETURNING *
    `;

    const values = [
      registration.f_name,
      registration.m_name,
      registration.l_name,
      registration.suffix,
      registration.email_address || null,
      registration.school || null,
      registration.or_number || null,
      registration.payment_date || null,
      registration.phone_number || null,
      orReceiptUrl,
      participantImageUrl,
      registration.position || null,
      registration.food_restriction || null,
      registration.event_id,
      registration.office_id || null,
      registration.participant_type 

    ];

    const result = await supabaseClient.query(query, values);

    if (result.rowCount === 1) {
      const allRows = await supabaseClient.query(`SELECT * FROM rael.registration Where event_id = '${registration.event_id}' ORDER BY id DESC`);
      res.status(200).json({ message: "Registration added successfully" , id_info: result.rows[0].id,count: allRows.rowCount});
      
    } else {
      res.status(500).json({ error: "Failed to add registration" });
    }
} catch (error) {
  // Check for trigger-based exceptions by matching the error message text
  const msg = error?.message?.toLowerCase();

  if (msg?.includes('email is already registered for this event')) {
    return res.status(409).json({ error: "Email is already registered for this event." });
  }

  if (msg?.includes('phone number is already registered for this event')) {
    return res.status(409).json({ error: "Phone number is already registered for this event." });
  }

  return res.status(500).json({ error: "Internal server error.", details: error.message });
}

});

router.get("/get", async (req, res) => {
  try {
    const query = `
 SELECT  
  rael.registration.id,
  rael.schools.school_id,
TRIM(CONCAT_WS(' ',
    registration.f_name,
    CASE
      WHEN registration.m_name IS NOT NULL AND registration.m_name <> ''
        THEN CONCAT(LEFT(registration.m_name, 1), '.')
      ELSE NULL
    END,
    registration.l_name,
    registration.suffix
)) AS full_name,
  rael.registration.email_address,
  rael.registration.phone_number,
  rael.registration.t_shirt_size,
  rael.registration.or_receipt_url,
  rael.registration.participant_image_url,
  rael.registration.position,
  rael.registration.food_restriction,
  rael.registration.payment_date,

  COALESCE(rael.schools.name, rael.section.name) AS school,
  COALESCE(rael.district.district_name, rael.functional_division.name) AS district_name,
  COALESCE(school_div.division_name, office_div.division_name) AS division_name,

  TO_CHAR(
    rael.registration.time_stamp AT TIME ZONE 'Asia/Manila',
    'FMMonth FMDD, YYYY hh12:mi AM'
  ) AS registration_date,
  rael.registration.certificate_access,
  rael.events.name AS event_name

FROM rael.registration

INNER JOIN rael.events 
  ON rael.registration.event_id = rael.events.id

LEFT JOIN rael.office 
  ON rael.registration.office_id = rael.office.id

LEFT JOIN rael.schools 
  ON rael.registration.school = rael.schools.school_id

LEFT JOIN rael.district 
  ON rael.schools.district_id = rael.district.id

LEFT JOIN rael.divisions AS school_div 
  ON rael.district.division_id = school_div.id

LEFT JOIN rael.divisions AS office_div 
  ON rael.office.division = office_div.id

LEFT JOIN rael.section 
  ON rael.office.section = rael.section.id

LEFT JOIN rael.functional_division 
  ON rael.office.functional_division = rael.functional_division.id

  ORDER BY registration.time_stamp DESC;
    `;

    const result = await supabaseClient.query(query);

    // Format payment_date before sending
    const formattedRows = result.rows.map(row => {
      const date = row.payment_date ? new Date(row.payment_date) : null;
      return {
        ...row,
        payment_date: date
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
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/update-certificate-access", async (req, res) => {
  const { ids, access } = req.body;

  if (!Array.isArray(ids) || typeof access !== "boolean") {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const query = `
    UPDATE rael.registration
    SET certificate_access = $1
    WHERE id = ANY($2::uuid[])
  `;

  try {
    await supabaseClient.query(query, [access, ids]);
    res.status(200).json({ message: "Certificate access updated successfully." });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ error: "Failed to update certificate access." });
  }
});


router.get("/get_data_id", async (req, res) => {
  try {
    const { phone_number } = req.query;

    if (!phone_number) {
      return res.status(400).json({ error: "Missing phone_number parameter" });
    }

    const query = `
       SELECT 
        registration.id,
     TRIM(CONCAT_WS(' ',
    registration.f_name,
    CASE
      WHEN registration.m_name IS NOT NULL AND registration.m_name <> ''
        THEN CONCAT(LEFT(registration.m_name, 1), '.')
      ELSE NULL
    END,
    registration.l_name,
    registration.suffix
)) AS full_name,
        rael.registration.phone_number,
        rael.registration.position,
        rael.events.name AS event_name,
CASE 
  WHEN EXTRACT(MONTH FROM events.start_date) = EXTRACT(MONTH FROM events.end_date)
       AND EXTRACT(YEAR FROM events.start_date) = EXTRACT(YEAR FROM events.end_date)
  THEN 
    TO_CHAR(events.start_date, 'FMMonth') || ' ' ||
    TO_CHAR(events.start_date, 'DD') || '-' ||
    TO_CHAR(events.end_date, 'DD, YYYY')
  ELSE
    TO_CHAR(events.start_date, 'FMMonth DD, YYYY') || ' – ' ||
    TO_CHAR(events.end_date, 'FMMonth DD, YYYY')
END AS formatted_event_date,


        rael.events.description AS event_description,
        schools.name AS school,
        section.name AS office,
        COALESCE(registration.f_name, 'N/A') AS name,
        COALESCE(registration.participant_image_url, '') AS participant_image_url,
        COALESCE(district.district_name, functional_division.name) AS district_name,
        COALESCE(school_div.division_name, office_div.division_name) AS division_name,
        COALESCE(registration.participant_type, 'N/A') AS participant_type

      FROM rael.registration
      INNER JOIN rael.events 
        ON registration.event_id = events.id
      LEFT JOIN rael.office 
        ON registration.office_id = office.id
      LEFT JOIN rael.functional_division 
        ON office.functional_division = functional_division.id
      LEFT JOIN rael.section 
        ON office.section = section.id
      LEFT JOIN rael.schools 
        ON registration.school = schools.school_id
      LEFT JOIN rael.district 
        ON schools.district_id = district.id
      LEFT JOIN rael.divisions AS school_div 
        ON district.division_id = school_div.id
      LEFT JOIN rael.divisions AS office_div 
        ON office.division = office_div.id
      WHERE registration.phone_number = $1;
    `;

    const result = await supabaseClient.query(query, [phone_number]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/get_participant", async (req, res) => {
  const { participant_id } = req.query;

  if (!participant_id) {
    return res.status(400).json({ error: "participant_id is required" });
  }

  try {
    const query = `
    SELECT 
        registration.id,
     TRIM(CONCAT_WS(' ',
    registration.f_name,
    CASE
      WHEN registration.m_name IS NOT NULL AND registration.m_name <> ''
        THEN CONCAT(LEFT(registration.m_name, 1), '.')
      ELSE NULL
    END,
    registration.l_name,
    registration.suffix
)) AS full_name,
        rael.registration.phone_number,
        rael.registration.position,
        rael.events.name AS event_name,
CASE 
  WHEN EXTRACT(MONTH FROM events.start_date) = EXTRACT(MONTH FROM events.end_date)
       AND EXTRACT(YEAR FROM events.start_date) = EXTRACT(YEAR FROM events.end_date)
  THEN 
    TO_CHAR(events.start_date, 'FMMonth') || ' ' ||
    TO_CHAR(events.start_date, 'DD') || '-' ||
    TO_CHAR(events.end_date, 'DD, YYYY')
  ELSE
    TO_CHAR(events.start_date, 'FMMonth DD, YYYY') || ' – ' ||
    TO_CHAR(events.end_date, 'FMMonth DD, YYYY')
END AS formatted_event_date,


        rael.events.description AS event_description,
        schools.name AS school,
        section.name AS office,
        COALESCE(registration.f_name, 'N/A') AS name,
        COALESCE(registration.participant_image_url, '') AS participant_image_url,
        COALESCE(district.district_name, functional_division.name) AS district_name,
        COALESCE(school_div.division_name, office_div.division_name) AS division_name,
        COALESCE(registration.participant_type, 'N/A') AS participant_type

      FROM rael.registration
      INNER JOIN rael.events 
        ON registration.event_id = events.id
      LEFT JOIN rael.office 
        ON registration.office_id = office.id
      LEFT JOIN rael.functional_division 
        ON office.functional_division = functional_division.id
      LEFT JOIN rael.section 
        ON office.section = section.id
      LEFT JOIN rael.schools 
        ON registration.school = schools.school_id
      LEFT JOIN rael.district 
        ON schools.district_id = district.id
      LEFT JOIN rael.divisions AS school_div 
        ON district.division_id = school_div.id
      LEFT JOIN rael.divisions AS office_div 
        ON office.division = office_div.id
      WHERE registration.id = $1
      LIMIT 1;
    `;

    const result = await supabaseClient.query(query, [participant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Participant not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/get_all_id", async (req, res) => {
  try {
    const query = `
      SELECT 
        registration.id,
        TRIM(CONCAT_WS(' ',
          registration.f_name,
          CASE
            WHEN registration.m_name IS NOT NULL AND registration.m_name <> ''
              THEN CONCAT(LEFT(registration.m_name, 1), '.')
            ELSE NULL
          END,
          registration.l_name,
          registration.suffix
        )) AS full_name,
        rael.registration.phone_number,
        rael.registration.position,
        rael.events.name AS event_name,
        CASE 
          WHEN EXTRACT(MONTH FROM events.start_date) = EXTRACT(MONTH FROM events.end_date)
               AND EXTRACT(YEAR FROM events.start_date) = EXTRACT(YEAR FROM events.end_date)
          THEN 
            TO_CHAR(events.start_date, 'FMMonth') || ' ' ||
            TO_CHAR(events.start_date, 'DD') || '-' ||
            TO_CHAR(events.end_date, 'DD, YYYY')
          ELSE
            TO_CHAR(events.start_date, 'FMMonth DD, YYYY') || ' – ' ||
            TO_CHAR(events.end_date, 'FMMonth DD, YYYY')
        END AS formatted_event_date,
        rael.events.description AS event_description,
        schools.name AS school,
        section.name AS office,
        COALESCE(registration.f_name, 'N/A') AS name,
        COALESCE(registration.participant_image_url, '') AS participant_image_url,
        COALESCE(district.district_name, functional_division.name) AS district_name,
        COALESCE(school_div.division_name, office_div.division_name) AS division_name,
        COALESCE(registration.participant_type, 'N/A') AS participant_type

      FROM rael.registration
      INNER JOIN rael.events 
        ON registration.event_id = events.id
      LEFT JOIN rael.office 
        ON registration.office_id = office.id
      LEFT JOIN rael.functional_division 
        ON office.functional_division = functional_division.id
      LEFT JOIN rael.section 
        ON office.section = section.id
      LEFT JOIN rael.schools 
        ON registration.school = schools.school_id
      LEFT JOIN rael.district 
        ON schools.district_id = district.id
      LEFT JOIN rael.divisions AS school_div 
        ON district.division_id = school_div.id
      LEFT JOIN rael.divisions AS office_div 
        ON office.division = office_div.id;
    `;

    const result = await supabaseClient.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/get_division_count", async (req, res) => {
 

  try {
    const query = `
SELECT 
  COALESCE(d.division_name, fd.name) AS division_name,
  COALESCE(dist.district_name, fd.name) AS district_or_fd,
  COALESCE(s.name, sec.name) AS school_or_section,

  TO_CHAR(a.date AT TIME ZONE 'Asia/Manila', 'Month/DD/YYYY') AS attendance_date,

  COUNT(DISTINCT r.id) AS total_registered,

  COUNT(DISTINCT a.participant_id) FILTER (
    WHERE (a.time_in IS NOT NULL OR a.time_out IS NOT NULL)
      AND a.date BETWEEN e.start_date AND e.end_date
  ) AS total_attended

FROM rael.registration r
LEFT JOIN rael.schools s ON r.school = s.school_id
LEFT JOIN rael.district dist ON s.district_id = dist.id
LEFT JOIN rael.office o ON r.office_id = o.id
LEFT JOIN rael.functional_division fd ON o.functional_division = fd.id
LEFT JOIN rael.section sec ON o.section = sec.id
LEFT JOIN rael.divisions d ON dist.division_id = d.id OR o.division = d.id
LEFT JOIN rael.events e ON r.event_id = e.id
LEFT JOIN rael.attendances a 
  ON r.id = a.participant_id 
  AND a.date BETWEEN e.start_date AND e.end_date

GROUP BY 
  COALESCE(d.division_name, fd.name),
  COALESCE(dist.district_name, fd.name),
  COALESCE(s.name, sec.name),
  attendance_date

ORDER BY 
  COALESCE(d.division_name, fd.name),
  COALESCE(dist.district_name, fd.name),
  COALESCE(s.name, sec.name),
  attendance_date;


    `;

    const result = await supabaseClient.query(query);

  

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




router.post("/delete_bulk", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided." });
    }

    // Get image filenames to delete for the selected IDs
    const { rows } = await supabaseClient.query(
      `SELECT or_receipt_url, participant_image_url FROM rael.registration WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    const filesToDelete = [];

    rows.forEach(row => {
      if (row.or_receipt_url) {
        const match = row.or_receipt_url.match(/\/storage\/v1\/object\/public\/image\/(.+)$/);
        if (match && match[1]) filesToDelete.push(match[1]);
      }
      if (row.participant_image_url) {
        const match = row.participant_image_url.match(/\/storage\/v1\/object\/public\/image\/(.+)$/);
        if (match && match[1]) filesToDelete.push(match[1]);
      }
    });

    // Delete associated files in Supabase storage
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("image")
        .remove(filesToDelete);

      if (storageError) {
        console.error("Error deleting files from storage:", storageError);
        return res.status(500).json({ error: "Failed to delete some files." });
      }
    }

    // Delete records from database
    await supabaseClient.query(
      `DELETE FROM rael.registration WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    res.status(200).json({ message: "Selected registrations and files deleted successfully." });

  } catch (error) {
    console.error("Error deleting selected registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
