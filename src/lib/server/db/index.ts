import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// During the Vite build phase (including post-build analysis), DATABASE_URL is
// not set. Provide a placeholder connection string to prevent module-level
// errors. No actual queries run during build — the connection is never used.
// At runtime, the real DATABASE_URL from environment variables is used.
const connectionString = building
	? 'postgresql://placeholder:placeholder@localhost:5432/placeholder'
	: env.DATABASE_URL;

const client = postgres(connectionString);

export const db = drizzle(client);
