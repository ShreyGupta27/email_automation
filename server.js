const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQLite Database (using sql.js)
const dbPath = path.join(__dirname, 'recipients.db');
let db = null;

const initDatabase = async () => {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE NOT NULL,
      designation TEXT,
      company_name TEXT,
      domain TEXT,
      unsubscribed BOOLEAN DEFAULT 0,
      unsubscribed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDatabase();
  console.log('✅ SQLite database initialized (recipients.db)');
};

const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

// ==================== RECIPIENT ROUTES ====================

// Get all recipients
app.get('/api/recipients', (req, res) => {
  try {
    const result = db.exec(`
      SELECT 
        id, 
        first_name as firstName, 
        last_name as lastName, 
        email, 
        designation, 
        company_name as companyName, 
        domain, 
        created_at as createdAt 
      FROM recipients 
      ORDER BY created_at DESC
    `);
    
    const rows = result.length > 0 ? result[0].values.map(row => {
      return {
        id: row[0],
        firstName: row[1],
        lastName: row[2],
        email: row[3],
        designation: row[4],
        companyName: row[5],
        domain: row[6],
        createdAt: row[7]
      };
    }) : [];
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
});

// Get single recipient
app.get('/api/recipients/:id', (req, res) => {
  try {
    const result = db.exec(
      'SELECT id, first_name as firstName, last_name as lastName, email, designation, company_name as companyName, domain, created_at FROM recipients WHERE id = ?',
      [req.params.id]
    );
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const row = result[0].values[0];
    res.json({
      id: row[0],
      firstName: row[1],
      lastName: row[2],
      email: row[3],
      designation: row[4],
      companyName: row[5],
      domain: row[6],
      created_at: row[7]
    });
  } catch (error) {
    console.error('Error fetching recipient:', error);
    res.status(500).json({ error: 'Failed to fetch recipient' });
  }
});

// Add new recipient
app.post('/api/recipients', (req, res) => {
  const { firstName, lastName, email, designation, companyName, domain } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if email already exists
    const existing = db.exec('SELECT id FROM recipients WHERE email = ?', [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    db.run(
      'INSERT INTO recipients (first_name, last_name, email, designation, company_name, domain) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, designation, companyName, domain]
    );
    saveDatabase();

    // Get the newly inserted recipient
    const result = db.exec('SELECT id, first_name as firstName, last_name as lastName, email, designation, company_name as companyName, domain, created_at FROM recipients WHERE email = ?', [email]);
    const row = result[0].values[0];
    
    res.status(201).json({
      id: row[0],
      firstName: row[1],
      lastName: row[2],
      email: row[3],
      designation: row[4],
      companyName: row[5],
      domain: row[6],
      created_at: row[7]
    });
  } catch (error) {
    console.error('Error adding recipient:', error);
    res.status(500).json({ error: 'Failed to add recipient' });
  }
});

// Bulk add recipients
app.post('/api/recipients/bulk', (req, res) => {
  const { recipients } = req.body;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients array is required' });
  }

  try {
    const addedRecipients = [];
    const skippedEmails = [];

    for (const recipient of recipients) {
      if (!recipient.email) continue;

      const existing = db.exec('SELECT id FROM recipients WHERE email = ?', [recipient.email]);
      if (existing.length > 0 && existing[0].values.length > 0) {
        skippedEmails.push(recipient.email);
        continue;
      }

      db.run(
        'INSERT INTO recipients (first_name, last_name, email, designation, company_name, domain) VALUES (?, ?, ?, ?, ?, ?)',
        [
          recipient.firstName || '',
          recipient.lastName || '',
          recipient.email,
          recipient.designation || '',
          recipient.companyName || '',
          recipient.domain || ''
        ]
      );

      const result = db.exec('SELECT id, first_name as firstName, last_name as lastName, email, designation, company_name as companyName, domain, created_at FROM recipients WHERE email = ?', [recipient.email]);
      const row = result[0].values[0];
      addedRecipients.push({
        id: row[0],
        firstName: row[1],
        lastName: row[2],
        email: row[3],
        designation: row[4],
        companyName: row[5],
        domain: row[6],
        created_at: row[7]
      });
    }

    saveDatabase();
    res.status(201).json({
      added: addedRecipients,
      skipped: skippedEmails,
      message: `Added ${addedRecipients.length} recipients. Skipped ${skippedEmails.length} duplicates.`
    });
  } catch (error) {
    console.error('Error bulk adding recipients:', error);
    res.status(500).json({ error: 'Failed to add recipients' });
  }
});

// Update recipient
app.put('/api/recipients/:id', (req, res) => {
  const { firstName, lastName, email, designation, companyName, domain } = req.body;
  const { id } = req.params;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const existing = db.exec('SELECT id FROM recipients WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    db.run(
      'UPDATE recipients SET first_name = ?, last_name = ?, email = ?, designation = ?, company_name = ?, domain = ? WHERE id = ?',
      [firstName, lastName, email, designation, companyName, domain, id]
    );
    saveDatabase();

    const result = db.exec('SELECT id, first_name as firstName, last_name as lastName, email, designation, company_name as companyName, domain, created_at FROM recipients WHERE id = ?', [id]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const row = result[0].values[0];
    res.json({
      id: row[0],
      firstName: row[1],
      lastName: row[2],
      email: row[3],
      designation: row[4],
      companyName: row[5],
      domain: row[6],
      created_at: row[7]
    });
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({ error: 'Failed to update recipient' });
  }
});

// Delete recipient
app.delete('/api/recipients/:id', (req, res) => {
  try {
    db.run('DELETE FROM recipients WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ message: 'Recipient deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({ error: 'Failed to delete recipient' });
  }
});

// Delete multiple recipients
app.post('/api/recipients/delete-multiple', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  try {
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM recipients WHERE id IN (${placeholders})`, ids);
    saveDatabase();
    
    res.json({ 
      message: `Deleted ${ids.length} recipients`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Error deleting recipients:', error);
    res.status(500).json({ error: 'Failed to delete recipients' });
  }
});

// Search recipients
app.get('/api/recipients/search', (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const searchPattern = `%${query}%`;
    const result = db.exec(`
      SELECT id, first_name as firstName, last_name as lastName, email, designation, company_name as companyName, domain, created_at 
      FROM recipients 
      WHERE first_name LIKE ? 
      OR last_name LIKE ? 
      OR email LIKE ? 
      OR company_name LIKE ? 
      OR designation LIKE ?
      ORDER BY created_at DESC
    `, [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]);

    const rows = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      firstName: row[1],
      lastName: row[2],
      email: row[3],
      designation: row[4],
      companyName: row[5],
      domain: row[6],
      created_at: row[7]
    })) : [];

    res.json(rows);
  } catch (error) {
    console.error('Error searching recipients:', error);
    res.status(500).json({ error: 'Failed to search recipients' });
  }
});

// ==================== STATISTICS ====================

app.get('/api/recipients/stats', (req, res) => {
  try {
    const totalResult = db.exec('SELECT COUNT(*) as total FROM recipients');
    const companyResult = db.exec('SELECT COUNT(DISTINCT company_name) as total FROM recipients WHERE company_name IS NOT NULL AND company_name != ""');
    const recentResult = db.exec('SELECT COUNT(*) as total FROM recipients WHERE created_at >= datetime("now", "-7 days")');

    res.json({
      total: totalResult[0]?.values[0]?.[0] || 0,
      companies: companyResult[0]?.values[0]?.[0] || 0,
      recentlyAdded: recentResult[0]?.values[0]?.[0] || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Unsubscribe recipient
app.post('/api/recipients/:id/unsubscribe', (req, res) => {
  try {
    db.run('UPDATE recipients SET unsubscribed = 1, unsubscribed_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ message: 'Recipient unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing recipient:', error);
    res.status(500).json({ error: 'Failed to unsubscribe recipient' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  saveDatabase();
  process.exit(0);
});
