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

async function createTestDocument() {
  try {
    console.log('Creating a test document...');
    
    // Get the first user ID
    const users = await client`
      SELECT id
      FROM "User"
      ORDER BY id
      LIMIT 1;
    `;
    
    if (users.length === 0) {
      console.error('No users found in the database');
      await client.end();
      return;
    }
    
    const userId = users[0].id;
    console.log(`Using user ID: ${userId}`);
    
    // Create a test document
    const document = await client`
      INSERT INTO "Document" (id, "createdAt", title, content, kind, "userId")
      VALUES (gen_random_uuid(), NOW(), 'Test Table Document', 'Name,Age,City\nJohn,25,New York\nJane,30,London\nBob,35,Paris', 'sheet', ${userId})
      RETURNING id, title, kind, "createdAt";
    `;
    
    console.log('Test document created successfully:');
    console.log(`- ID: ${document[0].id}`);
    console.log(`- Title: ${document[0].title}`);
    console.log(`- Kind: ${document[0].kind}`);
    console.log(`- Created at: ${document[0].createdAt}`);
    
    await client.end();
  } catch (error) {
    console.error('Error creating test document:', error);
    await client.end();
  }
}

createTestDocument();