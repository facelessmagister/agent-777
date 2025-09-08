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

async function checkUsers() {
  try {
    console.log('Checking users in the database...');
    
    // Query all users
    const users = await client`
      SELECT id, email
      FROM "User"
      ORDER BY id;
    `;
    
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log('---');
    }
    
    await client.end();
  } catch (error) {
    console.error('Error checking users:', error);
    await client.end();
  }
}

checkUsers();