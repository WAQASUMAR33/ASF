import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Exporting Database Records to CSV...');

  // 1. Export Users
  const users = await prisma.user.findMany({
    include: {
      station: true,
    },
  });

  const userCsvHeader = 'ID,Username,Email,FullName,Role,StationCode,StationName,IsActive,2FA_Enabled,CreatedAt\n';
  const userCsvRows = users.map((u) => {
    const stationCode = u.station ? u.station.code : 'HQ';
    const stationName = u.station ? `"${u.station.name}"` : '"Headquarters"';
    return `"${u.id}","${u.username}","${u.email || ''}","${u.fullName}","${u.role}","${stationCode}",${stationName},${u.isActive},${u.twoFactorEnabled},"${u.createdAt.toISOString()}"`;
  });

  const usersCsvPath = path.join(process.cwd(), 'users.csv');
  fs.writeFileSync(usersCsvPath, userCsvHeader + userCsvRows.join('\n'), 'utf-8');
  console.log(`✅ Exported ${users.length} Users to users.csv`);

  // 2. Export Stations & Manpower
  const stations = await prisma.station.findMany({
    include: {
      manpower: true,
    },
  });

  const stationCsvHeader = 'ID,StationCode,StationName,HeldMale,HeldFemale,TotalHeld,IsActive\n';
  const stationCsvRows = stations.map((s) => {
    const male = s.manpower ? s.manpower.heldMale : 0;
    const female = s.manpower ? s.manpower.heldFemale : 0;
    const total = s.manpower ? s.manpower.totalHeld : 0;
    return `"${s.id}","${s.code}","${s.name}",${male},${female},${total},${s.isActive}`;
  });

  const stationsCsvPath = path.join(process.cwd(), 'stations.csv');
  fs.writeFileSync(stationsCsvPath, stationCsvHeader + stationCsvRows.join('\n'), 'utf-8');
  console.log(`✅ Exported ${stations.length} Stations to stations.csv`);

  // 3. Export Kit Items
  const items = await prisma.kitItem.findMany({
    include: {
      category: true,
      sizes: true,
    },
  });

  const itemCsvHeader = 'ID,ItemCode,Name,Category,UnitOfIssue,ScaleOfIssue,LifeCycleYears,TargetGender,IsSeasonal,RequiresMeasurement\n';
  const itemCsvRows = items.map((i) => {
    return `"${i.id}","${i.itemCode}","${i.name}","${i.category.name}","${i.unitOfIssue}",${i.scaleOfIssue},${i.lifeCycleYears},"${i.targetGender}",${i.isSeasonal},${i.requiresMeasurement}`;
  });

  const itemsCsvPath = path.join(process.cwd(), 'kit_items.csv');
  fs.writeFileSync(itemsCsvPath, itemCsvHeader + itemCsvRows.join('\n'), 'utf-8');
  console.log(`✅ Exported ${items.length} Kit Items to kit_items.csv`);

  // 4. Also generate comprehensive user_credentials_export.csv with default passwords for seed accounts
  const seedPasswords: Record<string, string> = {
    clerk_khi: 'ASFPass123!',
    officer_khi: 'ASFPass123!',
    cso_khi: 'ASFPass123!',
    clerk_isb: 'ASFPass123!',
    dd_procurement: 'ASFPass123!',
    central_store: 'ASFPass123!',
    admin: 'ASFPass123!',
    superadmin: 'ASFPass123!',
  };

  const credHeader = 'Username,Email,FullName,Role,StationCode,DefaultPassword\n';
  const credRows = users.map((u) => {
    const stationCode = u.station ? u.station.code : 'HQ';
    const pwd = seedPasswords[u.username] || '[Hashed in DB]';
    return `"${u.username}","${u.email || ''}","${u.fullName}","${u.role}","${stationCode}","${pwd}"`;
  });

  const credCsvPath = path.join(process.cwd(), 'user_credentials_export.csv');
  fs.writeFileSync(credCsvPath, credHeader + credRows.join('\n'), 'utf-8');
  console.log(`✅ Exported ${users.length} Credentials to user_credentials_export.csv`);
}

main()
  .catch((e) => {
    console.error('❌ Export error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
