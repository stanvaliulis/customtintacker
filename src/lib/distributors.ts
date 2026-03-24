/**
 * Distributor credential store backed by data/distributors.json.
 *
 * This provides a simple file-based credential system that doesn't require a
 * database. When a distributor application is approved in the admin panel, their
 * credentials are saved here. The NextAuth CredentialsProvider checks this file
 * (and the WHOLESALE_CREDENTIALS env var) during login.
 *
 * On Vercel (read-only filesystem), writes fall back to an in-memory store for
 * the lifetime of the serverless function. For production persistence on Vercel,
 * use the database path or the WHOLESALE_CREDENTIALS env var.
 */

import fs from 'fs';
import path from 'path';

export interface DistributorRecord {
  email: string;
  password: string;
  companyName: string;
  contactName: string;
  asiNumber: string;
  sageNumber: string;
  ppaiNumber: string;
  discountTier: number;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

const JSON_PATH = path.join(process.cwd(), 'data', 'distributors.json');

// In-memory fallback for read-only filesystems (Vercel)
let memoryStore: DistributorRecord[] | null = null;

/**
 * Read all distributor records from the JSON file.
 */
export function readDistributors(): DistributorRecord[] {
  // If we have an in-memory store (from a write on a read-only FS), use it
  if (memoryStore !== null) {
    return memoryStore;
  }

  try {
    const raw = fs.readFileSync(JSON_PATH, 'utf-8');
    return JSON.parse(raw) as DistributorRecord[];
  } catch {
    // File doesn't exist or is malformed — return empty array
    return [];
  }
}

/**
 * Write all distributor records to the JSON file.
 * Falls back to in-memory store if the filesystem is read-only.
 */
export function writeDistributors(distributors: DistributorRecord[]): void {
  try {
    // Ensure the data directory exists
    const dir = path.dirname(JSON_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(JSON_PATH, JSON.stringify(distributors, null, 2), 'utf-8');
    // Clear memory store since we successfully wrote to disk
    memoryStore = null;
  } catch {
    // Read-only filesystem (Vercel) — use in-memory fallback
    console.warn('[Distributors] Filesystem is read-only, using in-memory store');
    memoryStore = distributors;
  }
}

/**
 * Find a distributor by email (case-insensitive).
 */
export function findDistributorByEmail(email: string): DistributorRecord | undefined {
  const distributors = readDistributors();
  return distributors.find(
    (d) => d.email.toLowerCase() === email.toLowerCase() && d.status === 'approved'
  );
}

/**
 * Add or update a distributor record.
 * If a record with the same email exists, it will be replaced.
 */
export function upsertDistributor(record: DistributorRecord): void {
  const distributors = readDistributors();
  const index = distributors.findIndex(
    (d) => d.email.toLowerCase() === record.email.toLowerCase()
  );

  if (index >= 0) {
    distributors[index] = record;
  } else {
    distributors.push(record);
  }

  writeDistributors(distributors);
}

/**
 * Parse the WHOLESALE_CREDENTIALS env var.
 * Format: "email:password:CompanyName,email2:password2:CompanyName2"
 */
export function parseEnvCredentials(): Array<{
  email: string;
  password: string;
  companyName: string;
}> {
  const raw = process.env.WHOLESALE_CREDENTIALS || '';
  if (!raw) return [];

  return raw.split(',').map((entry) => {
    const [email, password, companyName] = entry.split(':');
    return {
      email: email?.trim() || '',
      password: password?.trim() || '',
      companyName: companyName?.trim() || email?.trim() || '',
    };
  });
}
