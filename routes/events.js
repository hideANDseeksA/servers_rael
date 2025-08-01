require('dotenv').config();
const express = require('express');
const { supabasePool  } = require('../config/database');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const mime = require('mime-types');
const router = express.Router();

// Create a Supabase client instance
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Set up multer to store file in memory (not on disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// CREATE an event with direct file upload to Supabase
router.post("/create_event", upload.single('certificateFile'), async (req, res) => {
  try {
   const { name, host, description, start_date, end_date, active, required_receipt, venue } = req.body;

  

    if (req.file) {
      const fileBuffer = req.file.buffer; // File data from memory
      const mimeType = mime.lookup(req.file.originalname);

      // Upload the file directly to Supabase Storage
      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(`event_certificates/${name}-${Date.now()}${path.extname(req.file.originalname)}`, fileBuffer, {
          contentType: mimeType
        });

      if (error) {
        return res.status(500).json({ error: "Failed to upload certificate file." });
      }

      // Get the URL of the uploaded file
      const certificateUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/certificates/${data.path}`;

      // Insert the event record with the certificate URL
      const query = `
        INSERT INTO rael.events (name, host, description, start_date, end_date, active, required_reciept, venue, certificates_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [name, host, description, start_date, end_date, active, required_receipt, venue, certificateUrl];

      const result = await supabasePool.query(query, values);

      res.status(200).json({ message: "Event created successfully", event: result.rows[0] });
    } else {
      return res.status(400).json({ error: "Certificate file is required." });
    }
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// GET all events
router.get("/get_event", async (req, res) => {
  try {
    const query = `
      SELECT id, name, host, description, start_date, end_date, active, required_reciept, venue, certificates_url
      FROM rael.events
    `;
    const result = await supabasePool.query(query);

    const formatted = result.rows.map(row => ({
      ...row,
      start_date: row.start_date ? new Date(row.start_date).toLocaleDateString('en-US') : "",
      end_date: row.end_date ? new Date(row.end_date).toLocaleDateString('en-US') : ""
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET only active events
router.get("/get_active_events", async (req, res) => {
  try {
    const query = `
      SELECT id, name, description, start_date, end_date, active, required_reciept, venue, certificates_url
      FROM rael.events
      WHERE active = true
    `;
    const result = await supabasePool.query(query);

    const formatted = result.rows.map(row => ({
      ...row,
      start_date: row.start_date ? new Date(row.start_date).toLocaleDateString('en-US') : "",
      end_date: row.end_date ? new Date(row.end_date).toLocaleDateString('en-US') : ""
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching active events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// UPDATE an event

// UPDATE an event (direct upload to Supabase Storage)

router.put("/update_event/:id", upload.single('certificateFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, host, description, start_date, end_date, active, required_reciept, venue } = req.body;

    if (!name || !host || !description || !start_date || !end_date || active === undefined || required_reciept === undefined || !venue) {
      return res.status(400).json({ error: "All fields are required." });
    }

    let certificateUrl = null;

    // Get the existing certificate URL
    const existing = await supabasePool.query(
      `SELECT certificates_url FROM rael.events WHERE id = $1`,
      [id]
    );

    let oldCertificatePath = null;

    if (existing.rows.length > 0 && existing.rows[0].certificates_url) {
      const fullUrl = existing.rows[0].certificates_url;
      const publicUrlPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/certificates/`;
      if (fullUrl.startsWith(publicUrlPrefix)) {
        oldCertificatePath = fullUrl.replace(publicUrlPrefix, '');
      }
    }

    // Upload new certificate if provided
    if (req.file) {
      // Delete old file if it exists
      if (oldCertificatePath) {
        await supabase.storage.from('certificates').remove([oldCertificatePath]);
      }

      const fileBuffer = req.file.buffer;
      const mimeType = mime.lookup(req.file.originalname);
      const filename = `event_certificates/${name}-${Date.now()}${path.extname(req.file.originalname)}`;

      const { data, error } = await supabase.storage
        .from('certificates')
        .upload(filename, fileBuffer, {
          contentType: mimeType,
        });

      if (error) {
        return res.status(500).json({ error: "Failed to upload new certificate file." });
      }

      certificateUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/certificates/${data.path}`;
    } else {
      // No new file uploaded, retain old URL
      certificateUrl = existing.rows[0]?.certificates_url || null;
    }

    const query = `
      UPDATE rael.events
      SET name = $1, host = $2, description = $3, start_date = $4, end_date = $5, active = $6, required_reciept = $7, venue = $8, certificates_url = $9
      WHERE id = $10
      RETURNING *
    `;
    const values = [
      name,
      host,
      description,
      start_date,
      end_date,
      active,
      required_reciept,
      venue,
      certificateUrl,
      id,
    ];

    const result = await supabasePool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.status(200).json({
      message: "Event updated successfully",
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// DELETE an event
// DELETE an event
router.delete("/delete_event/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the certificate URL
    const selectQuery = `SELECT certificates_url FROM rael.events WHERE id = $1`;
    const selectResult = await supabasePool.query(selectQuery, [id]);

    if (selectResult.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    const certificateUrl = selectResult.rows[0].certificates_url;

    // Delete the event from the database
    const deleteQuery = `DELETE FROM rael.events WHERE id = $1 RETURNING *`;
    const deleteResult = await supabasePool.query(deleteQuery, [id]);

    // If there's a certificate URL, delete the file from Supabase Storage
    if (certificateUrl) {
      const publicUrlPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/certificates/`;
      const filePath = certificateUrl.replace(publicUrlPrefix, ''); // Extract relative path

      console.log("Deleting file from storage:", filePath); // Optional: log for debugging

      const { error: deleteError } = await supabase.storage.from('certificates').remove([filePath]);

      if (deleteError) {
        console.error("Failed to delete file from storage:", deleteError.message);
        // File deletion failed, but do not block the main response
      }
    }

    res.status(200).json({ message: "Event and associated certificate deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
