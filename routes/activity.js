const express = require('express');
const { supabaseClient } = require('../config/database');
const router = express.Router();

// CREATE activity
router.post('/', async (req, res) => {
  const { title, description, activity_time, activity_date, event_id, evaluation_link, active_status } = req.body;
  try {
    const result = await supabaseClient.query(
      `INSERT INTO rael.activity (title, description, activity_time, activity_date, event_id, evaluation_link, active_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, activity_time, activity_date, event_id, evaluation_link, active_status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/', async (req, res) => {
  try {
  const result = await supabaseClient.query(`
  SELECT 
    a.id,
    a.title,
    a.description,
    TO_CHAR(a.activity_time, 'HH12:MI AM') AS activity_time,
    TO_CHAR(a.activity_date, 'YYYY-MM-DD') AS activity_date,
    a.event_id,
    a.evaluation_link,
    a.active_status,
    e.name AS event_name
  FROM rael.activity a
  LEFT JOIN rael.events e ON a.event_id = e.id
  ORDER BY a.activity_date ASC;
`);


    const activities = result.rows;

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// READ ONE activity
router.get('/active', async (req, res) => {
  try {
    const result = await supabaseClient.query(
      'SELECT * FROM rael.activity WHERE active_status = true limit 1',

    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE activity
router.put('/:id', async (req, res) => {
  const { title, description, activity_time, activity_date, event_id, evaluation_link, active_status } = req.body;
  try {
    const result = await supabaseClient.query(
      `UPDATE rael.activity
       SET title = $1,
           description = $2,
           activity_time = $3,
           activity_date = $4,
           event_id = $5,
           evaluation_link = $6,
           active_status = $7
       WHERE id = $8
       RETURNING *`,
      [title, description, activity_time, activity_date, event_id, evaluation_link, active_status, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE activity
router.delete('/:id', async (req, res) => {
  try {
    const result = await supabaseClient.query(
      'DELETE FROM rael.activity WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
