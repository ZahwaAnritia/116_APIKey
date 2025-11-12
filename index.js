import express from 'express';
import mysql from 'mysql2';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 3000;


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'apikey_db',
  port: 3309
});

db.connect(err => {
  if (err) {
    console.error('❌ Gagal koneksi ke MySQL:', err);
    return;
  }
  console.log('✅ Terkoneksi ke MySQL');
});


function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/generate', (req, res) => {
  const apikey = generateApiKey(32);

  const query = 'INSERT INTO apikeys (`key`, created_at) VALUES (?, NOW())';
  db.query(query, [apikey], err => {
    if (err) {
      console.error('❌ Gagal menyimpan API key:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Gagal menyimpan API key ke database.' 
      });
    }

    res.json({
      success: true,
      apikey,
      message: '✅ API key berhasil dibuat dan disimpan di database.',
      created_at: new Date().toISOString()
    });
  });
});
