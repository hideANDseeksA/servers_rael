
const { Client, Pool } = require('pg');


// Supabase PostgreSQL Configuration (using environment variable for connection string)
const supabaseDbConfig = {
  connectionString: process.env.DATABASE_URL, // Supabase URL
  ssl: { rejectUnauthorized: false },
};

// Create Supabase PostgreSQL client and pool
const supabaseClient = new Client(supabaseDbConfig);
const supabasePool = new Pool(supabaseDbConfig);

// Connect to Supabase PostgreSQL
supabaseClient.connect()
  .then(() => {
    console.log('Connected to Supabase PostgreSQL');
  })
  .catch((err) => {
    console.error('Error connecting to Supabase PostgreSQL:', err.stack);
  });


// Export the configurations
module.exports = { supabaseClient, supabasePool };
