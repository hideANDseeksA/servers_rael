const express = require('express');
const { supabaseClient } = require('../config/database');
const router = express.Router();



router.get("/get_events_types", async (req, res) => {
  try {
    const query = `
      SELECT * FROM events_types ORDER BY category ASC
    `;

    const result = await supabaseClient.query(query);



    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching events_types", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// CREATE an event
router.post("/create_event", async (req, res) => {
  try {
    const { name, host, description, start_date, end_date, active, required_reciept, venue } = req.body;

    if (!name || !host || !description || !start_date || !end_date || active === undefined || required_reciept === undefined || !venue) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const query = `
      INSERT INTO rael.events (name, host, description, start_date, end_date, active, required_reciept, venue)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [name, host, description, start_date, end_date, active, required_reciept, venue];

    const result = await supabaseClient.query(query, values);
    res.status(200).json({ message: "Event created successfully", event: result.rows[0] });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all events
router.get("/get_event", async (req, res) => {
  try {
    const query = `
      SELECT id, name, host, description, start_date, end_date, active, required_reciept, venue
      FROM rael.events
    `;
    const result = await supabaseClient.query(query);

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
 SELECT id, name, description, start_date, end_date, active, required_reciept, venue,
EXTRACT(YEAR FROM CURRENT_DATE) AS current_year
FROM rael.events
WHERE active = true;

    `;
    const result = await supabaseClient.query(query);

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
router.put("/update_event/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, host, description, start_date, end_date, active, required_reciept, venue } = req.body;

    if (!name || !host || !description || !start_date || !end_date || active === undefined || required_reciept === undefined || !venue) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const query = `
      UPDATE rael.events
      SET name = $1, host = $2, description = $3, start_date = $4, end_date = $5, active = $6, required_reciept = $7, venue = $8
      WHERE id = $9
      RETURNING *
    `;
    const values = [name, host, description, start_date, end_date, active, required_reciept, venue, id];

    const result = await supabaseClient.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.status(200).json({ message: "Event updated successfully", event: result.rows[0] });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE an event
router.delete("/delete_event/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM rael.events WHERE id = $1 RETURNING *`;
    const result = await supabaseClient.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
