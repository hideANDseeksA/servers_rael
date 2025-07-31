const express = require('express');
const { supabaseClient } = require('../config/database');
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { activity_email, participant_email } = req.body;

    if (!activity_email || !participant_email) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const query = `
      INSERT INTO rael.evaluation_participant (activity_id, participant_email)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [activity_email, participant_email];

    const result = await supabaseClient.query(query, values);
    res.status(200).json({ message: "Evaluation created successfully", evaluation: result.rows[0] });
  } catch (error) {
    console.error("Error creating evaluation:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "Participant has already submitted an evaluation for this activity.",
        detail: error.detail,
      });
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = `SELECT 
  ep.id AS evaluation_id,
  ep.participant_email,
  ep.date AS evaluation_date,
  a.title AS activity_name,
  e.name AS event_name
FROM rael.evaluation_participant ep
JOIN rael.activity a ON a.id::text = ep.activity_id
JOIN rael.events e ON a.event_id = e.id;
`;
    const result = await supabaseClient.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/", async (req, res) => {
  try {
    const query = `DELETE FROM rael.evaluation_participant`;
    await supabaseClient.query(query);
    res.status(200).json({ message: "All evaluation records deleted successfully." });
  } catch (error) {
    console.error("Error deleting evaluations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
