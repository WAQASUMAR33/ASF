import { PrismaClient, DemandStatus, DistributionStatus, Gender } from '@prisma/client';

const prisma = new PrismaClient();

// Station to Administration Region Mapping
const STATION_ADMIN_MAP: Record<string, 'Central' | 'North' | 'South' | 'East' | 'West'> = {
  ISB: 'North', PEW: 'North', RWP: 'North', GIL: 'North', KDU: 'North', ISU: 'North', CHB: 'North', MFG: 'North', DSK: 'North',
  LHE: 'Central', SKT: 'Central', LYP: 'Central', MUX: 'Central', BHV: 'Central', RYK: 'Central', DBA: 'Central',
  KHI: 'South', HDD: 'South', SKZ: 'South', BDN: 'South', WNS: 'South', O99: 'South', JAG: 'South',
  UET: 'West', GWD: 'West', PBN: 'West', PJG: 'West', PAS: 'West', KDD: 'West', ZGZ: 'West',
};

async function main() {
  console.log('🚀 Populating comprehensive operational database records...');

  const stations = await prisma.station.findMany({
    include: { manpower: true, users: true },
  });

  const kitItems = await prisma.kitItem.findMany({
    include: { sizes: true, category: true },
  });

  const users = await prisma.user.findMany();
  const adminUser = users.find((u) => u.role === 'SYSTEM_ADMIN') || users[0];

  if (!stations.length || !kitItems.length || !adminUser) {
    console.error('Missing prerequisite stations, items, or users.');
    return;
  }

  // Define monthly dates for the last 6 months (Mar to Aug 2026)
  const months = [
    { name: 'Mar', date: new Date('2026-03-15T10:00:00Z') },
    { name: 'Apr', date: new Date('2026-04-15T10:00:00Z') },
    { name: 'May', date: new Date('2026-05-15T10:00:00Z') },
    { name: 'Jun', date: new Date('2026-06-15T10:00:00Z') },
    { name: 'Jul', date: new Date('2026-07-15T10:00:00Z') },
    { name: 'Aug', date: new Date('2026-08-15T10:00:00Z') },
  ];

  // 1. Create realistic demands for major and regional stations across administrations
  const demandConfigs = [
    // North Stations
    { stationCode: 'ISB', monthIdx: 4, multiplier: 0.65 },
    { stationCode: 'PEW', monthIdx: 3, multiplier: 0.55 },
    { stationCode: 'RWP', monthIdx: 2, multiplier: 0.45 },
    { stationCode: 'GIL', monthIdx: 1, multiplier: 0.35 },
    { stationCode: 'KDU', monthIdx: 5, multiplier: 0.40 },
    // Central Stations
    { stationCode: 'LHE', monthIdx: 4, multiplier: 0.70 },
    { stationCode: 'MUX', monthIdx: 3, multiplier: 0.50 },
    { stationCode: 'SKT', monthIdx: 2, multiplier: 0.45 },
    { stationCode: 'LYP', monthIdx: 5, multiplier: 0.40 },
    { stationCode: 'BHV', monthIdx: 1, multiplier: 0.30 },
    // South Stations
    { stationCode: 'KHI', monthIdx: 4, multiplier: 0.75 },
    { stationCode: 'HDD', monthIdx: 3, multiplier: 0.40 },
    { stationCode: 'SKZ', monthIdx: 2, multiplier: 0.35 },
    { stationCode: 'WNS', monthIdx: 1, multiplier: 0.30 },
    { stationCode: 'BDN', monthIdx: 5, multiplier: 0.25 },
    // West Stations
    { stationCode: 'UET', monthIdx: 3, multiplier: 0.50 },
    { stationCode: 'GWD', monthIdx: 4, multiplier: 0.45 },
    { stationCode: 'PBN', monthIdx: 2, multiplier: 0.30 },
    { stationCode: 'PAS', monthIdx: 1, multiplier: 0.25 },
    { stationCode: 'KDD', monthIdx: 5, multiplier: 0.20 },
  ];

  let createdDemandsCount = 0;
  let createdItemsCount = 0;

  for (let idx = 0; idx < demandConfigs.length; idx++) {
    const cfg = demandConfigs[idx];
    const station = stations.find((s) => s.code === cfg.stationCode);
    if (!station) continue;

    const manpower = station.manpower?.totalHeld || 500;
    const mInfo = months[cfg.monthIdx];
    const demandNum = `DEM-${station.code}-2026-${String(idx + 1).padStart(4, '0')}`;

    // Create or find station clerk/user
    const stationUser = station.users[0] || adminUser;

    const demand = await prisma.stationDemand.upsert({
      where: { demandNumber: demandNum },
      update: {
        status: DemandStatus.APPROVED_BY_STATION,
        createdAt: mInfo.date,
        updatedAt: mInfo.date,
      },
      create: {
        demandNumber: demandNum,
        stationId: station.id,
        fiscalYear: 2026,
        status: DemandStatus.APPROVED_BY_STATION,
        createdById: stationUser.id,
        createdAt: mInfo.date,
        updatedAt: mInfo.date,
      },
    });

    createdDemandsCount++;

    // Add demand items for key categories (Uniform, Headwear, Footwear, Outerwear, Tailored)
    for (const item of kitItems) {
      const scale = Number(item.scaleOfIssue) || 1.0;
      const maxAllowed = Math.floor(manpower * scale * cfg.multiplier);
      const demandedQty = Math.max(10, Math.floor(maxAllowed * 0.9));
      const approvedQty = Math.floor(demandedQty * 0.85);

      const size = item.sizes[0] || null;

      // Check existing item
      const existingItem = await prisma.stationDemandItem.findFirst({
        where: { demandId: demand.id, itemId: item.id },
      });

      if (!existingItem) {
        await prisma.stationDemandItem.create({
          data: {
            demandId: demand.id,
            itemId: item.id,
            sizeId: size ? size.id : null,
            calculatedMaxAllowed: maxAllowed,
            demandedQuantity: demandedQty,
            approvedQuantity: approvedQty,
          },
        });
        createdItemsCount++;
      }
    }

    // Also create matching historical distributions for stock fulfillment
    const dispatchNum = `DSP-HQ-2026-${String(idx + 1).padStart(4, '0')}`;
    const distDate = new Date(mInfo.date.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    const dist = await prisma.inventoryDistribution.upsert({
      where: { dispatchNumber: dispatchNum },
      update: {
        status: DistributionStatus.ISSUED,
        createdAt: distDate,
        updatedAt: distDate,
      },
      create: {
        dispatchNumber: dispatchNum,
        stationId: station.id,
        status: DistributionStatus.ISSUED,
        notes: `Central Store seasonal dispatch for ${station.name}`,
        createdAt: distDate,
        updatedAt: distDate,
      },
    });

    // Add distribution items
    for (const item of kitItems) {
      const size = item.sizes[0] || null;
      const issuedQty = Math.floor(manpower * 0.7 * cfg.multiplier);

      const existingDistItem = await prisma.distributionItem.findFirst({
        where: { distributionId: dist.id, itemId: item.id },
      });

      if (!existingDistItem) {
        await prisma.distributionItem.create({
          data: {
            distributionId: dist.id,
            itemId: item.id,
            sizeId: size ? size.id : null,
            issuedQty: Math.max(5, issuedQty),
          },
        });
      }
    }
  }

  // 2. Adjust Central Stock items to ensure healthy, low, and out-of-stock representation
  const allCentralStocks = await prisma.centralStock.findMany({
    include: { item: true },
  });

  for (let i = 0; i < allCentralStocks.length; i++) {
    const cs = allCentralStocks[i];
    let newQty = cs.availableQty;

    // Distribute realistic stock levels across inventory
    if (i % 8 === 0) {
      newQty = 0; // Out of Stock
    } else if (i % 4 === 0) {
      newQty = Math.floor(Math.random() * 400) + 100; // Low Stock (< 500)
    } else {
      newQty = Math.floor(Math.random() * 3000) + 1500; // Healthy Stock (>= 1500)
    }

    await prisma.centralStock.update({
      where: { id: cs.id },
      data: { availableQty: newQty },
    });
  }

  console.log(`✅ Successfully populated:`);
  console.log(`   - ${createdDemandsCount} Station Demands`);
  console.log(`   - ${createdItemsCount} Station Demand Items`);
  console.log(`   - ${allCentralStocks.length} Central Stock records calibrated`);
}

main()
  .catch((e) => {
    console.error('Error populating database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
