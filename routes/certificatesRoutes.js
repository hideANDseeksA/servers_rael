const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { execFile } = require('child_process');
const router = express.Router();
const { supabasePool } = require('../config/database');

const pythonPath = 'python3'; // ✅ Use system Python in Docker
const tempDir = path.join(__dirname, '../temp');

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

router.get('/generate-certificate', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  try {
    const { rows } = await supabasePool.query(
      `SELECT  
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
        e.certificates_url,
        COALESCE(s.name, sec.name) AS office_value,
        COALESCE(sd.division_name, od.division_name) AS division
      FROM rael.registration r
      INNER JOIN rael.events e ON r.event_id = e.id
      LEFT JOIN rael.office o ON r.office_id = o.id
      LEFT JOIN rael.schools s ON r.school = s.school_id
      LEFT JOIN rael.district d ON s.district_id = d.id
      LEFT JOIN rael.divisions sd ON d.division_id = sd.id
      LEFT JOIN rael.divisions od ON o.division = od.id
      LEFT JOIN rael.section sec ON o.section = sec.id
      WHERE r.phone_number = $1
      LIMIT 1`,
      [phone]
    );

    if (!rows.length) return res.status(404).json({ error: 'No record found' });

    const { full_name, certificates_url, division, office_value } = rows[0];

    const inputPath = path.join(tempDir, `${Date.now()}_input.docx`);
    const outputPath = inputPath.replace('.docx', '.pdf');

    const fileRes = await fetch(certificates_url);
    if (!fileRes.ok) throw new Error(`Failed to fetch DOCX: ${fileRes.statusText}`);
    const buffer = await fileRes.buffer();
    fs.writeFileSync(inputPath, buffer);

    execFile(
      pythonPath,
      ['convert.py', inputPath, outputPath, full_name, office_value || '', division || ''],
      (error, stdout, stderr) => {
        if (error) {
          console.error('[Python Error]', stderr || error.message);
          return res.status(500).json({ error: 'Conversion failed' });
        }

        console.log('[Python STDOUT]', stdout);

        res.download(outputPath, `${full_name.replace(/\s+/g, '_')}_certificate.pdf`, err => {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
          if (err) console.error('[Download error]', err);
        });
      }
    );
  } catch (err) {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
