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

async function checkDocuments() {
  try {
    console.log('Checking documents in the database...');
    
    // Query all documents
    const documents = await client`
      SELECT id, title, kind, content, "createdAt", "userId"
      FROM "Document"
      ORDER BY "createdAt" DESC;
    `;
    
    console.log(`Found ${documents.length} documents:`);
    
    for (const doc of documents) {
      console.log(`- ID: ${doc.id}`);
      console.log(`  Title: ${doc.title}`);
      console.log(`  Kind: ${doc.kind}`);
      console.log(`  Content preview: ${doc.content?.substring(0, 100)}...`);
      console.log(`  Created at: ${doc.createdAt}`);
      console.log(`  User ID: ${doc.userId}`);
      console.log('---');
    }
    
    await client.end();
  } catch (error) {
    console.error('Error checking documents:', error);
    await client.end();
  }
}

checkDocuments();