import bcrypt from 'bcryptjs';

interface LegacyAccount {
  email: string; password: string; companyName: string; contactName?: string;
  asiNumber?: string; sageNumber?: string; ppaiNumber?: string;
  discountTier?: number; status: 'approved' | 'pending' | 'rejected'; createdAt?: string;
}

/** Offline preparation only; no reads, writes, logging, or automatic login migration. */
export async function prepareLegacyDistributorAccounts(records: readonly LegacyAccount[]) {
  const seen = new Set<string>();
  // Validate the entire inventory before hashing anything. Never put record values in errors.
  for (const record of records) {
    const email = record.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || seen.has(email)) {
      throw new Error('Legacy inventory contains invalid or duplicate email identities');
    }
    seen.add(email);
    if (!['approved', 'pending', 'rejected'].includes(record.status) ||
        typeof record.password !== 'string' || !record.password ||
        Buffer.byteLength(record.password, 'utf8') > 72 || !record.companyName ||
        (record.discountTier !== undefined && (!Number.isFinite(record.discountTier) || record.discountTier < 0 || record.discountTier > 1))) {
      throw new Error('Legacy inventory requires manual reconciliation');
    }
  }
  return Promise.all(records.map(async record => ({
    email: record.email.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(record.password, 12),
    status: record.status === 'approved' ? 'approved' : 'disabled',
    profile: {
      legacySubject: record.email.trim(),
      companyName: record.companyName, contactName: record.contactName || '',
      asiNumber: record.asiNumber || '', sageNumber: record.sageNumber || '',
      ppaiNumber: record.ppaiNumber || '', discountTier: record.discountTier ?? 0.40,
      legacyStatus: record.status, legacyCreatedAt: record.createdAt || null,
    },
  })));
}
