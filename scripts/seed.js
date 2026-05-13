import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/FinTrust AI' });

async function seed() {
  await client.connect();
  const hash = await bcrypt.hash('Admin123!', 10);
  await client.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('admin@FinTrust AI.com', $1, 'Admin', 'User', 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );
  await client.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ('demo@FinTrust AI.com', $1, 'Demo', 'User', 'user')
     ON CONFLICT (email) DO NOTHING`,
    [hash]
  );
  console.log('Seed complete. Demo users: admin@FinTrust AI.com, demo@FinTrust AI.com (password: Admin123!)');
  await client.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
