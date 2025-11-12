index.js
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

// ========================================
// 📄 Halaman utama (optional UI)
// ========================================
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


app.post('/checkapi', (req, res) => {
  const { apikey } = req.body;

  if (!apikey) {
    return res.status(400).json({ 
      valid: false, 
      message: '⚠️ API key wajib dikirim dalam body JSON.' 
    });
  }

  db.query('SELECT * FROM apikeys WHERE `key` = ?', [apikey], (err, results) => {
    if (err) {
      console.error('❌ Kesalahan database:', err);
      return res.status(500).json({ 
        valid: false, 
        message: 'Kesalahan server saat validasi API key.' 
      });
    }

    if (results.length > 0) {
      res.json({
        valid: true,
        message: '✅ API key valid dan terdaftar.',
        data: results[0]
      });
    } else {
      res.json({
        valid: false,
        message: '❌ API key tidak valid atau belum terdaftar.'
      });
    }
  });
});


app.get('/allkeys', (req, res) => {
  db.query('SELECT `key`, created_at FROM apikeys ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('❌ Gagal ambil data:', err);
      return res.status(500).json({
        success: false,
        message: 'Kesalahan mengambil data dari database.'
      });
    }

    res.json({
      success: true,
      total: results.length,
      keys: results
    });
  });
});

app.delete('/deleteapi', (req, res) => {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ 
      success: false, 
      message: '⚠️ API key wajib dikirim di parameter ?key=' 
    });
  }

  db.query('DELETE FROM apikeys WHERE `key` = ?', [key], (err, result) => {
    if (err) {
      console.error('❌ Gagal hapus API key:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Kesalahan server saat menghapus API key.' 
      });
    }

    if (result.affectedRows > 0) {
      res.json({ 
        success: true, 
        message: '✅ API key berhasil dihapus.' 
      });
    } else {
      res.json({ 
        success: false, 
        message: '❌ API key tidak ditemukan.' 
      });
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
