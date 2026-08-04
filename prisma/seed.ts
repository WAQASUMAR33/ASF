import { PrismaClient, Role, AccountingUnit, Gender, DemandStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ASF IMS Database Seeding...');

  // Password Hash for test users: "ASFPass123!"
  const passwordHash = await bcrypt.hash('ASFPass123!', 10);

  // 1. Create ASF Stations (30+ stations across Pakistan)
  const stationData = [
    { code: 'KHI', name: 'Jinnah International Airport (Karachi)', heldMale: 1850, heldFemale: 320 },
    { code: 'ISB', name: 'Islamabad International Airport (Islamabad)', heldMale: 1600, heldFemale: 280 },
    { code: 'LHE', name: 'Allama Iqbal International Airport (Lahore)', heldMale: 1450, heldFemale: 250 },
    { code: 'PEW', name: 'Bacha Khan International Airport (Peshawar)', heldMale: 920, heldFemale: 110 },
    { code: 'UET', name: 'Quetta International Airport (Quetta)', heldMale: 780, heldFemale: 85 },
    { code: 'MUX', name: 'Multan International Airport (Multan)', heldMale: 640, heldFemale: 70 },
    { code: 'SKT', name: 'Sialkot International Airport (Sialkot)', heldMale: 520, heldFemale: 60 },
    { code: 'LYP', name: 'Faisalabad International Airport (Faisalabad)', heldMale: 480, heldFemale: 50 },
    { code: 'SKZ', name: 'Sukkur Airport (Sukkur)', heldMale: 350, heldFemale: 40 },
    { code: 'GWD', name: 'Gwadar International Airport (Gwadar)', heldMale: 410, heldFemale: 35 },
    { code: 'GIL', name: 'Gilgit Airport (Gilgit)', heldMale: 220, heldFemale: 25 },
    { code: 'KDU', name: 'Skardu International Airport (Skardu)', heldMale: 260, heldFemale: 30 },
    { code: 'BDN', name: 'Talhar Airport (Badin)', heldMale: 180, heldFemale: 20 },
    { code: 'HDD', name: 'Hyderabad Airport (Hyderabad)', heldMale: 290, heldFemale: 30 },
    { code: 'PBN', name: 'Turbat Airport (Turbat)', heldMale: 230, heldFemale: 20 },
    { code: 'PJG', name: 'Panjgur Airport (Panjgur)', heldMale: 190, heldFemale: 15 },
    { code: 'PAS', name: 'Pasni Airport (Pasni)', heldMale: 170, heldFemale: 15 },
    { code: 'WNS', name: 'Nawabshah Airport (Nawabshah)', heldMale: 210, heldFemale: 20 },
    { code: 'RYK', name: 'Sheikh Zayed International Airport (Rahim Yar Khan)', heldMale: 310, heldFemale: 30 },
    { code: 'DBA', name: 'Dera Ghazi Khan Airport (D.G. Khan)', heldMale: 240, heldFemale: 25 },
    { code: 'BHV', name: 'Bahawalpur Airport (Bahawalpur)', heldMale: 280, heldFemale: 30 },
    { code: 'ISU', name: 'Saidu Sharif Airport (Swat)', heldMale: 190, heldFemale: 15 },
    { code: 'CHB', name: 'Chilas Airport (Chilas)', heldMale: 150, heldFemale: 10 },
    { code: 'MFG', name: 'Muzaffarabad Airport (Muzaffarabad)', heldMale: 160, heldFemale: 15 },
    { code: 'RWP', name: 'Dhamial Air Base (Rawalpindi)', heldMale: 320, heldFemale: 35 },
    { code: 'JAG', name: 'Jacobabad Air Base (Jacobabad)', heldMale: 250, heldFemale: 20 },
    { code: 'KDD', name: 'Khuzdar Airport (Khuzdar)', heldMale: 140, heldFemale: 10 },
    { code: 'O99', name: 'Moenjodaro Airport (Moenjodaro)', heldMale: 160, heldFemale: 15 },
    { code: 'ZGZ', name: 'Zhob Airport (Zhob)', heldMale: 130, heldFemale: 10 },
    { code: 'DSK', name: 'Dera Ismail Khan Airport (D.I. Khan)', heldMale: 210, heldFemale: 20 },

  ];

  const createdStations: Record<string, any> = {};

  for (const st of stationData) {
    const station = await prisma.station.upsert({
      where: { code: st.code },
      update: { name: st.name },
      create: {
        code: st.code,
        name: st.name,
      },
    });

    createdStations[st.code] = station;

    // Create / Update Manpower Matrix
    const totalHeld = st.heldMale + st.heldFemale;
    await prisma.stationManpower.upsert({
      where: { stationId: station.id },
      update: {
        heldMale: st.heldMale,
        heldFemale: st.heldFemale,
        totalHeld: totalHeld,
      },
      create: {
        stationId: station.id,
        heldMale: st.heldMale,
        heldFemale: st.heldFemale,
        totalHeld: totalHeld,
      },
    });
  }

  console.log(`✅ Seeded ${stationData.length} ASF Stations & Manpower Matrix.`);

  // 2. Create RBAC Test Users
  const khiStation = createdStations['KHI'];
  const isbStation = createdStations['ISB'];

  const users = [
    {
      username: 'clerk_khi',
      email: 'clerk.khi@asf.gov.pk',
      fullName: 'Muhammad Ali (Store Clerk - KHI)',
      role: Role.STORE_CLERK,
      stationId: khiStation.id,
    },
    {
      username: 'officer_khi',
      email: 'officer.khi@asf.gov.pk',
      fullName: 'Insp. Tariq Mehmood (Store Officer - KHI)',
      role: Role.STORE_OFFICER,
      stationId: khiStation.id,
    },
    {
      username: 'cso_khi',
      email: 'cso.khi@asf.gov.pk',
      fullName: 'Lt. Col. Kamran Ahmed (CSO - KHI)',
      role: Role.CSO,
      stationId: khiStation.id,
    },
    {
      username: 'clerk_isb',
      email: 'clerk.isb@asf.gov.pk',
      fullName: 'Usman Ghani (Store Clerk - ISB)',
      role: Role.STORE_CLERK,
      stationId: isbStation.id,
    },
    {
      username: 'dd_procurement',
      email: 'dd.procurement@asf.gov.pk',
      fullName: 'Dir. Rashid Minhas (DD Procurement - HQ)',
      role: Role.DD_PROCUREMENT,
      stationId: null,
    },
    {
      username: 'central_store',
      email: 'central.store@asf.gov.pk',
      fullName: 'Major Shahid Khan (Central Store HQ Manager)',
      role: Role.CENTRAL_STORE,
      stationId: null,
    },
    {
      username: 'admin',
      email: 'admin@asf.gov.pk',
      fullName: 'System Administrator (ASF HQ)',
      role: Role.SYSTEM_ADMIN,
      stationId: null,
    },
    {
      username: 'superadmin',
      email: 'superadmin@asf.gov.pk',
      fullName: 'Super Administrator (Executive HQ)',
      role: Role.SYSTEM_ADMIN,
      stationId: null,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        fullName: u.fullName,
        role: u.role,
        stationId: u.stationId,
        passwordHash: passwordHash,
      },
      create: {
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        stationId: u.stationId,
        passwordHash: passwordHash,
        twoFactorEnabled: false,
      },
    });
  }

  console.log(`✅ Seeded ${users.length} RBAC Users across stations and HQ.`);

  // 3. Create Item Categories & Kit Items
  const catUniform = await prisma.itemCategory.upsert({
    where: { name: 'Field & Service Uniforms' },
    update: {},
    create: { name: 'Field & Service Uniforms', description: 'Standard operational and service dress kits' },
  });

  const catHeadwear = await prisma.itemCategory.upsert({
    where: { name: 'Headwear & Caps' },
    update: {},
    create: { name: 'Headwear & Caps', description: 'Beret caps, peaked caps, camouflage caps' },
  });

  const catFootwear = await prisma.itemCategory.upsert({
    where: { name: 'Footwear & Boots' },
    update: {},
    create: { name: 'Footwear & Boots', description: 'Combat boots, parade shoes, oxford shoes' },
  });

  const catOuterwear = await prisma.itemCategory.upsert({
    where: { name: 'Outerwear & Seasonal' },
    update: {},
    create: { name: 'Outerwear & Seasonal', description: 'Parka jackets, raincoats, jerseys' },
  });

  const catTailored = await prisma.itemCategory.upsert({
    where: { name: 'Tailored & Ceremonial' },
    update: {},
    create: { name: 'Tailored & Ceremonial', description: 'Ceremonial coats, mess dresses, custom fit suits' },
  });

  // Kit Items with Size Charts & Central Stock
  const kitItemsData = [
    {
      itemCode: 'UNI-CAM-01',
      name: 'ASF Camouflage Operational Uniform',
      categoryId: catUniform.id,
      unitOfIssue: AccountingUnit.SET,
      scaleOfIssue: 2.0, // 2 sets per head
      lifeCycleYears: 1,
      targetGender: Gender.UNISEX,
      isSeasonal: false,
      requiresMeasurement: false,
      sizes: ['Small (S)', 'Medium (M)', 'Large (L)', 'X-Large (XL)', 'XX-Large (XXL)'],
      initialStock: [4500, 7200, 6800, 3100, 1200],
    },
    {
      itemCode: 'HDW-BER-01',
      name: 'ASF Blue Beret Cap with Crest',
      categoryId: catHeadwear.id,
      unitOfIssue: AccountingUnit.NO,
      scaleOfIssue: 1.0,
      lifeCycleYears: 2,
      targetGender: Gender.UNISEX,
      isSeasonal: false,
      requiresMeasurement: false,
      sizes: ['Size 56', 'Size 57', 'Size 58', 'Size 59', 'Size 60'],
      initialStock: [1500, 3200, 4500, 2800, 1100],
    },
    {
      itemCode: 'FTW-CBT-01',
      name: 'Tactical High-Ankle Combat Boots',
      categoryId: catFootwear.id,
      unitOfIssue: AccountingUnit.PAIR,
      scaleOfIssue: 1.0,
      lifeCycleYears: 2,
      targetGender: Gender.UNISEX,
      isSeasonal: false,
      requiresMeasurement: false,
      sizes: ['Size 39', 'Size 40', 'Size 41', 'Size 42', 'Size 43', 'Size 44', 'Size 45'],
      initialStock: [800, 1800, 3500, 4200, 3100, 1400, 600],
    },
    {
      itemCode: 'OUT-JCK-01',
      name: 'Heavy Duty Winter Parka Jacket',
      categoryId: catOuterwear.id,
      unitOfIssue: AccountingUnit.NO,
      scaleOfIssue: 1.0,
      lifeCycleYears: 4,
      targetGender: Gender.UNISEX,
      isSeasonal: true,
      requiresMeasurement: false,
      sizes: ['Medium (M)', 'Large (L)', 'X-Large (XL)'],
      initialStock: [2100, 3800, 1900],
    },
    {
      itemCode: 'TLR-FMC-01',
      name: 'Female Officer Tailored Service Coat',
      categoryId: catTailored.id,
      unitOfIssue: AccountingUnit.NO,
      scaleOfIssue: 1.0,
      lifeCycleYears: 3,
      targetGender: Gender.FEMALE,
      isSeasonal: false,
      requiresMeasurement: true,
      sizes: ['Custom Tailored'],
      initialStock: [500],
    },
    {
      itemCode: 'ACC-BLT-01',
      name: 'ASF Tactical Duty Webbing Belt',
      categoryId: catUniform.id,
      unitOfIssue: AccountingUnit.NO,
      scaleOfIssue: 1.0,
      lifeCycleYears: 2,
      targetGender: Gender.UNISEX,
      isSeasonal: false,
      requiresMeasurement: false,
      sizes: ['Standard Adjustable'],
      initialStock: [8500],
    },
  ];

  for (const itemDef of kitItemsData) {
    const item = await prisma.kitItem.upsert({
      where: { itemCode: itemDef.itemCode },
      update: {
        name: itemDef.name,
        categoryId: itemDef.categoryId,
        unitOfIssue: itemDef.unitOfIssue,
        scaleOfIssue: itemDef.scaleOfIssue,
        lifeCycleYears: itemDef.lifeCycleYears,
        targetGender: itemDef.targetGender,
        isSeasonal: itemDef.isSeasonal,
        requiresMeasurement: itemDef.requiresMeasurement,
      },
      create: {
        itemCode: itemDef.itemCode,
        name: itemDef.name,
        categoryId: itemDef.categoryId,
        unitOfIssue: itemDef.unitOfIssue,
        scaleOfIssue: itemDef.scaleOfIssue,
        lifeCycleYears: itemDef.lifeCycleYears,
        targetGender: itemDef.targetGender,
        isSeasonal: itemDef.isSeasonal,
        requiresMeasurement: itemDef.requiresMeasurement,
      },
    });

    // Create sizes and stock allocations
    for (let i = 0; i < itemDef.sizes.length; i++) {
      const sizeLabel = itemDef.sizes[i];
      const stockQty = itemDef.initialStock[i] || 1000;

      const sizeChart = await prisma.itemSizeChart.upsert({
        where: { itemId_sizeLabel: { itemId: item.id, sizeLabel } },
        update: { sortOrder: i + 1 },
        create: {
          itemId: item.id,
          sizeLabel: sizeLabel,
          sortOrder: i + 1,
        },
      });

      // Update Central Stock
      await prisma.centralStock.upsert({
        where: { itemId_sizeId: { itemId: item.id, sizeId: sizeChart.id } },
        update: { availableQty: stockQty },
        create: {
          itemId: item.id,
          sizeId: sizeChart.id,
          availableQty: stockQty,
          reservedQty: 0,
        },
      });
    }
  }

  console.log(`✅ Seeded ${kitItemsData.length} Kit Items with size charts and central stocks.`);
  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
