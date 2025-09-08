import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

// Get the database URL from environment variables
const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('POSTGRES_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(databaseUrl);

async function checkSchema() {
  try {
    console.log('Checking Document table schema...');
    
    // Query to get table schema information
    const schemaInfo = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Document'
      ORDER BY ordinal_position;
    `;
    
    console.log('Document table columns:');
    for (const column of schemaInfo) {
      console.log(`- ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable}, default: ${column.column_default})`);
    }
    
    // Check if the table exists
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Document'
      );
    `;
    
    console.log(`\nDocument table exists: ${tableExists[0].exists}`);
    
    await client.end();
  } catch (error) {
    console.error('Error checking schema:', error);
    await client.end();
  }
}

checkSchema();