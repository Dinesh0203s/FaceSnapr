import { config } from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { Client } from '@prisma/client';

// Load environment variables
config();

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/facesnapr';

if (!process.env.DATABASE_URL) {
    console.warn('No DATABASE_URL provided, using default local database URL');
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });

export const prisma = new Client({
    datasources: {
        db: {
            url: databaseUrl,
        },
    },
});
