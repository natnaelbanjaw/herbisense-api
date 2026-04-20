import { Pool } from 'pg';
import env from './src/config/env.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully!\n');

    // Check all tables
    console.log('📋 Listing all tables:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    tablesResult.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    console.log();

    // Check herbs table structure
    console.log('🌿 Checking herbs table structure:');
    const herbColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'herbs'
      ORDER BY ordinal_position;
    `);
    
    herbColumnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'})`);
    });
    console.log();

    // Check herbs data
    console.log('📊 Checking herbs data:');
    const herbCountResult = await client.query('SELECT COUNT(*) as total FROM herbs;');
    console.log(`  Total herbs: ${herbCountResult.rows[0].total}`);
    
    const herbStatusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM herbs 
      GROUP BY status 
      ORDER BY status;
    `);
    
    console.log('  Status distribution:');
    herbStatusResult.rows.forEach(row => {
      console.log(`    - ${row.status}: ${row.count}`);
    });
    console.log();

    // Show sample herbs
    console.log('🔍 Sample herbs (first 5):');
    const sampleHerbsResult = await client.query(`
      SELECT id, name, status, created_at 
      FROM herbs 
      ORDER BY id 
      LIMIT 5;
    `);
    
    sampleHerbsResult.rows.forEach(herb => {
      console.log(`  - ID: ${herb.id}, Name: ${herb.name}, Status: ${herb.status}, Created: ${herb.created_at}`);
    });
    console.log();

    // Check other important tables
    console.log('👥 Checking users:');
    const userCountResult = await client.query('SELECT COUNT(*) as total FROM users;');
    console.log(`  Total users: ${userCountResult.rows[0].total}`);
    console.log();

    console.log('🩺 Checking conditions:');
    const conditionCountResult = await client.query('SELECT COUNT(*) as total FROM conditions;');
    console.log(`  Total conditions: ${conditionCountResult.rows[0].total}`);
    console.log();

    console.log('⭐ Checking ratings:');
    const ratingCountResult = await client.query('SELECT COUNT(*) as total FROM ratings;');
    console.log(`  Total ratings: ${ratingCountResult.rows[0].total}`);
    console.log();

    client.release();
    console.log('✅ Database check completed successfully!');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();