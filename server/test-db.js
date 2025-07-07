// Simple database connection test
const { db } = require('./src/db/knex');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        const result = await db.raw('SELECT 1');
        console.log('Database connection successful:', result);
        await db.destroy();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

testConnection();
