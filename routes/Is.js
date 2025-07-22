const express = require('express');
const { supabaseClient } = require('../config/database');
const router = express.Router();




router.get("/get_all_workstation", async (req, res) => {
    try {
        const result = await supabaseClient.query(`SELECT 
  w.id AS workstation_id,
  w.name AS workstation_name,
  w.type AS workstation_type,
  w.office_level,
  w.description,
  w.created_at,
  w.updated_at,

  -- Location info
  l.address_line,
  l.barangay,
  l.city,
  l.province,
  l.region AS location_region,
  l.postal_code,
  l.latitude,
  l.longitude,

  -- District info
  d.id AS district_id,
  d.name AS district_name,

  -- Division info
  dv.id AS division_id,
  dv.name AS division_name,
  dv.description AS division_description,
  dv.size AS division_size,

  -- Region info
  r.id AS region_id,
  r.name AS region_name,
  r.regioncode

FROM public.workstations w

LEFT JOIN public.locations l ON w.location_id = l.id
LEFT JOIN public.districts d ON w.district_id = d.id
LEFT JOIN public.divisions dv ON w.division_id = dv.id
LEFT JOIN public.regions r ON w.region_id = r.id;
`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching id_content:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/get_all_public_schools", async (req, res) => {
    try {
        const result = await supabaseClient.query(`
            SELECT 
  s.workstation_id,
  ws.name AS school_name,
  s.sector
FROM public.schools s
JOIN public.workstations ws ON s.workstation_id = ws.id
WHERE s.sector = 'Public';

`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching id_content:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/get_all_private_schools", async (req, res) => {
    try {
        const result = await supabaseClient.query(`
            SELECT 
  s.workstation_id,
  ws.name AS school_name,
  s.sector
FROM public.schools s
JOIN public.workstations ws ON s.workstation_id = ws.id
WHERE s.sector = 'Private';

`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching id_content:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/get_all_office", async (req, res) => {
    try {
        const result = await supabaseClient.query(`
    SELECT 
  o.workstation_id,
  ws.name AS office_name,
  o.office_name AS office_alias,
  o.level,
  r.name AS region_name,
  d.name AS division_name,
  o.description
FROM public.offices o
JOIN public.workstations ws ON o.workstation_id = ws.id
LEFT JOIN public.regions r ON o.region_id = r.id
LEFT JOIN public.divisions d ON o.division_id = d.id;

`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching id_content:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
