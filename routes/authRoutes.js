const express = require('express');
const { supabaseClient  } = require('../config/database');
const { encryptData, decryptData } = require('../config/encryption');
const router = express.Router();
const { sendEmail } = require('../config/email');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const rateLimit = require('express-rate-limit');


const adminAttemps = new rateLimit.MemoryStore();






const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    message: "❌ Too many attempts. Please try again later."
  },
keyGenerator: (req) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  return xForwardedFor ? xForwardedFor.split(',')[0] : req.ip;
},
  store: adminAttemps,
  standardHeaders: true,
  legacyHeaders: false,
});







router.post("/auth_admin", adminLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔍 Look for the user in the DB (username = email)
    const result = await supabaseClient.query(
      "SELECT * FROM rael.admin WHERE username = $1",
      [email]
    );

    // ❌ User not found
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email." });
    }

    const admin = result.rows[0];

    // 🔄 Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Add all permissions to the token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.username,
        role: admin.role,
        can_manage_users: admin.can_manage_users,
        can_manage_transactions: admin.can_manage_transactions,
        can_generate_certificates: admin.can_generate_certificates,
        can_manage_residents: admin.can_manage_residents,
        can_bulk_operations: admin.can_bulk_operations,
        can_access_logs: admin.can_access_logs,
      },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    // ✅ Auth successful, include all permissions in response
    res.status(200).json({
      message: "✅ Authentication successful!",
      token
      
    });

    // 📝 Reset attempts by IP
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = xForwardedFor ? xForwardedFor.split(',')[0] : req.ip;
    adminAttemps.resetKey(ip);

  } catch (error) {
    console.error("❌ Error during authentication:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});
router.get('/get_admin', async (req, res) => {
  try {
    const result = await supabaseClient.query('SELECT * FROM rael.admin');
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: 'Failed to fetch admins', details: error.message });
  }
});

// CREATE ADMIN
router.post('/create_admin', async (req, res) => {
 
 const {
  username,
  password,
  role,
  can_manage_users,
  can_manage_transactions,
  can_generate_certificates,
  can_manage_residents,
  can_bulk_operations,
  can_access_logs
} = req.body;
  if (!username?.trim() || !password?.trim() || !role?.trim()) {
  return res.status(400).json({ error: 'Username, password, and role are required.' });
}

  try {

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const result = await supabaseClient.query(
  `INSERT INTO rael.admin (
    username, password, role,
    can_manage_users, can_manage_transactions,
    can_generate_certificates, can_manage_residents,
    can_bulk_operations, can_access_logs
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING id, username, role`,
  [
    username,        // $1
    hashedPassword,  // $2
    role,            // $3
    can_manage_users,          // $4
    can_manage_transactions,   // $5
    can_generate_certificates, // $6
    can_manage_residents,      // $7
    can_bulk_operations,       // $8
    can_access_logs            // $9
  ]
);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: 'Failed to create admin', details: error.message });
  }
});

// UPDATE ADMIN
router.put('/update_admin', async (req, res) => {
  const {
    id,
    username,
    role,
    can_manage_users,
    can_manage_transactions,
    can_generate_certificates,
    can_manage_residents,
    can_bulk_operations,
    can_access_logs
  } = req.body;

  try {
    const result = await supabaseClient.query(
      `UPDATE rael.admin SET
        username = $1,
        role = $2,
        can_manage_users = $3,
        can_manage_transactions = $4,
        can_generate_certificates = $5,
        can_manage_residents = $6,
        can_bulk_operations = $7,
        can_access_logs = $8
      WHERE id = $9
      RETURNING id, username, role`,
      [
        username,
        role,
        can_manage_users,
        can_manage_transactions,
        can_generate_certificates,
        can_manage_residents,
        can_bulk_operations,
        can_access_logs,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ error: 'Failed to update admin', details: error.message });
  }
});


router.delete("/delete_admin", async (req, res) => {
  const { id } = req.body;
  try {
    await supabaseClient.query("DELETE FROM admin where id = $1", [id]);
    res.send("Admin Deleted");
  } catch (error) {
    console.error("Error deleting Admin:", error);
    res.status(500).send("Internal Server Error");
  }
});




module.exports = router;


