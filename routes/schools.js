const express = require('express');
const { supabaseClient } = require('../config/database');
const router = express.Router();



router.get("/get", async (req, res) => {
  try {
    const query = `
      SELECT 
  schools.school_id,
  schools.name AS school_name,
  schools.sector,
  district.district_name,
  divisions.division_name
FROM rael.schools
JOIN rael.district ON schools.district_id = district.id
JOIN rael.divisions ON district.division_id = divisions.id ORDER BY name ASC

    `;

    const result = await supabaseClient.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/get_office", async (req, res) => {
  try {
    const query = `
     SELECT 
     o.id,
  s.name AS section_name,
  d.division_name AS division_name,
  f.name AS functional_division_name
FROM rael.office o
INNER JOIN rael.functional_division f ON o.functional_division = f.id
INNER JOIN rael.section s ON o.section = s.id
INNER JOIN rael.divisions d ON o.division = d.id;
    `;

    const result = await supabaseClient.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



module.exports = router;
