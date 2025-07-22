// const { Client, Pool } = require('pg');
// const { createClient } = require('@supabase/supabase-js');
// const fs = require('fs');
// const path = require('path');

// const { DATABASE_URL, SUPABASE_URL, SUPABASE_KEY } = process.env;

// if (!SUPABASE_URL) {
//   throw new Error('SUPABASE_URL is required.');
// }

// if (!SUPABASE_KEY) {
//   throw new Error('SUPABASE_KEY is required.');
// }

// if (!DATABASE_URL) {
//   throw new Error('DATABASE_URL is required.');
// }

// const client = new Client({
//   connectionString: DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
// });

// const pool = new Pool({
//   connectionString: DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
// });

// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// client.connect()
//   .then(() => console.log('PostgreSQL client connected successfully'))
//   .catch(err => console.error('Connection error', err.stack));

// async function createNews(title, content, imagePath) {
//   const client = await pool.connect();
//   try {
//     const fileBuffer = fs.readFileSync(imagePath);
//     const fileName = `${Date.now()}-${path.basename(imagePath)}`;

//     const { data, error } = await supabase.storage
//       .from('image')
//       .upload(fileName, fileBuffer, {
//         contentType: 'image/jpeg', // Adjust based on file type
//         cacheControl: '3600',
//         upsert: false,
//       });

//     if (error) {
//       console.error('Error uploading to Supabase:', error);
//       throw error;
//     }

//     if (!data || !data.path) {
//       throw new Error('Upload successful, but file path is missing.');
//     }

//     const { data: publicUrlData } = supabase.storage.from('news').getPublicUrl(data.path);

//     if (!publicUrlData.publicUrl) {
//       throw new Error('Failed to get the public URL of the uploaded image.');
//     }

//     const publicURL = publicUrlData.publicUrl;

//     const query = 'INSERT INTO news (title, content, image_url) VALUES ($1, $2, $3) RETURNING *';
//     const result = await client.query(query, [title, content, publicURL]);

//     return result.rows[0];
//   } catch (err) {
//     console.error('Error creating news:', err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// async function updateNews(id, title, content, imagePath) {
//   const client = await pool.connect();
//   try {
//     let publicURL = null;

//     if (imagePath) {
//       const getQuery = 'SELECT image_url FROM news WHERE id = $1';
//       const getResult = await client.query(getQuery, [id]);
//       const newsItem = getResult.rows[0];

//       if (!newsItem) {
//         throw new Error('News item not found');
//       }

//       const oldImageUrl = newsItem.image_url;
//       const oldFilePath = oldImageUrl.split('/').pop();

//       const { error: deleteError } = await supabase.storage
//         .from('news')
//         .remove([oldFilePath]);

//       if (deleteError) {
//         console.error('Error deleting old image from Supabase:', deleteError);
//         throw deleteError;
//       }

//       const fileBuffer = fs.readFileSync(imagePath);
//       const fileName = `${Date.now()}-${path.basename(imagePath)}`;

//       const { data, error } = await supabase.storage
//         .from('news')
//         .upload(fileName, fileBuffer, {
//           contentType: 'image/jpeg',
//           cacheControl: '3600',
//           upsert: false,
//         });

//       if (error) {
//         console.error('Error uploading new image to Supabase:', error);
//         throw error;
//       }

//       if (!data || !data.path) {
//         throw new Error('Upload successful, but file path is missing.');
//       }

//       const { data: publicUrlData } = supabase.storage.from('news').getPublicUrl(data.path);

//       if (!publicUrlData.publicUrl) {
//         throw new Error('Failed to get the public URL of the uploaded image.');
//       }

//       publicURL = publicUrlData.publicUrl;
//     }

//     const query = `
//       UPDATE news
//       SET title = $1, content = $2, image_url = COALESCE($3, image_url)
//       WHERE id = $4
//       RETURNING *`;
//     const result = await client.query(query, [title, content, publicURL, id]);

//     return result.rows[0];
//   } catch (err) {
//     console.error('Error updating news:', err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// async function deleteNews(id) {
//   const client = await pool.connect();
//   try {
//     const getQuery = 'SELECT image_url FROM news WHERE id = $1';
//     const getResult = await client.query(getQuery, [id]);
//     const newsItem = getResult.rows[0];

//     if (!newsItem) {
//       throw new Error('News item not found');
//     }

//     const imageUrl = newsItem.image_url;
//     const filePath = imageUrl.split('/').pop();

//     const { error: deleteError } = await supabase.storage
//       .from('news')
//       .remove([filePath]);

//     if (deleteError) {
//       console.error('Error deleting image from Supabase:', deleteError);
//       throw deleteError;
//     }

//     const query = 'DELETE FROM news WHERE id = $1 RETURNING *';
//     const result = await client.query(query, [id]);

//     return result.rows[0];
//   } catch (err) {
//     console.error('Error deleting news:', err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// async function getAllNews() {
//   const client = await pool.connect();
//   try {
//     const query = 'SELECT * FROM news';
//     const result = await client.query(query);

//     return result.rows;
//   } catch (err) {
//     console.error('Error retrieving all news:', err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// async function getNewsById(id) {
//   const client = await pool.connect();
//   try {
//     const query = 'SELECT * FROM news WHERE id = $1';
//     const result = await client.query(query, [id]);

//     return result.rows[0];
//   } catch (err) {
//     console.error('Error retrieving news by ID:', err);
//     throw err;
//   } finally {
//     client.release();
//   }
// }

// module.exports = {
//   createNews,
//   updateNews,
//   deleteNews,
//   getAllNews,
//   getNewsById,
// };