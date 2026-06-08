import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ACPL 3 database...');

  // ---------- Super Admin ----------
  const adminHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@acpl3.com' },
    update: {},
    create: { email: 'admin@acpl3.com', password: adminHash, role: 'SUPER_ADMIN', name: 'ACPL Admin' },
  });
  console.log('Admin: admin@acpl3.com / Admin@123');

  // ---------- Teams ----------
  const teamData = [
    { name: 'Mumbai Mavericks',  color: '#3B82F6' },
    { name: 'Delhi Destroyers',  color: '#EF4444' },
    { name: 'Chennai Chargers',  color: '#10B981' },
    { name: 'Kolkata Knights',   color: '#8B5CF6' },
  ];

  const teams: { id: string; name: string }[] = [];
  for (const t of teamData) {
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: {},
      create: { name: t.name, color: t.color, purse: 100, remainingPurse: 100 },
    });
    teams.push(team);
  }

  // ---------- Captains (User with teamId) ----------
  const captainPassword = await bcrypt.hash('Captain@123', 12);
  const captains = [
    { email: 'captain1@acpl3.com', name: 'Raj Sharma',   teamIdx: 0 },
    { email: 'captain2@acpl3.com', name: 'Arjun Mehta',  teamIdx: 1 },
    { email: 'captain3@acpl3.com', name: 'Vikas Gupta',  teamIdx: 2 },
    { email: 'captain4@acpl3.com', name: 'Amit Patel',   teamIdx: 3 },
  ];

  for (const c of captains) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password: captainPassword,
        role: 'CAPTAIN',
        name: c.name,
        teamId: teams[c.teamIdx].id,
      },
    });
    console.log(`Captain: ${c.email} → ${teams[c.teamIdx].name}`);
  }

  // ---------- Players ----------
  const players = [
    { fullName: 'Karan Verma',      primaryRole: 'BATTER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'DOES_NOT_BOWL',       matchesPlayed: 40, runs: 1200, highestScore: 89, battingAverage: 35.2, strikeRate: 138.5, wickets:  0, economyRate: 0.0, catches: 18, runOuts: 5, momAwards:  6, basePrice: 20 },
    { fullName: 'Suresh Nair',       primaryRole: 'BATTER',        battingStyle: 'LEFT_HAND',  bowlingStyle: 'LEFT_ARM_ORTHODOX',   matchesPlayed: 35, runs:  980, highestScore: 76, battingAverage: 32.0, strikeRate: 130.2, wickets:  4, economyRate: 7.2, catches: 12, runOuts: 3, momAwards:  4, basePrice: 15 },
    { fullName: 'Pradeep Singh',     primaryRole: 'BOWLER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_FAST',      matchesPlayed: 45, runs:  220, highestScore: 28, battingAverage:  8.8, strikeRate:  95.0, wickets: 62, economyRate: 6.5, catches: 20, runOuts: 2, momAwards:  8, basePrice: 20 },
    { fullName: 'Ravi Kumar',        primaryRole: 'BOWLER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_LEG_SPIN',  matchesPlayed: 38, runs:  180, highestScore: 22, battingAverage:  7.2, strikeRate:  88.0, wickets: 52, economyRate: 7.0, catches: 14, runOuts: 1, momAwards:  5, basePrice: 15 },
    { fullName: 'Mohit Joshi',       primaryRole: 'ALL_ROUNDER',   battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_MEDIUM',    matchesPlayed: 50, runs:  950, highestScore: 72, battingAverage: 28.0, strikeRate: 125.0, wickets: 45, economyRate: 7.5, catches: 22, runOuts: 6, momAwards: 10, basePrice: 25 },
    { fullName: 'Ankit Tiwari',      primaryRole: 'WICKET_KEEPER', battingStyle: 'RIGHT_HAND', bowlingStyle: 'DOES_NOT_BOWL',       matchesPlayed: 42, runs:  760, highestScore: 65, battingAverage: 25.3, strikeRate: 140.0, wickets:  0, economyRate: 0.0, catches: 48, runOuts:12, momAwards:  5, basePrice: 20 },
    { fullName: 'Deepak Rao',        primaryRole: 'BATTER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_OFF_SPIN',  matchesPlayed: 30, runs:  820, highestScore: 91, battingAverage: 38.0, strikeRate: 145.0, wickets:  8, economyRate: 8.1, catches: 10, runOuts: 4, momAwards:  7, basePrice: 20 },
    { fullName: 'Varun Malhotra',    primaryRole: 'BOWLER',        battingStyle: 'LEFT_HAND',  bowlingStyle: 'LEFT_ARM_FAST',       matchesPlayed: 28, runs:   95, highestScore: 15, battingAverage:  6.3, strikeRate:  78.0, wickets: 38, economyRate: 6.2, catches:  9, runOuts: 1, momAwards:  4, basePrice: 15 },
    { fullName: 'Sachin Dubey',      primaryRole: 'ALL_ROUNDER',   battingStyle: 'LEFT_HAND',  bowlingStyle: 'LEFT_ARM_WRIST_SPIN', matchesPlayed: 44, runs: 1050, highestScore: 82, battingAverage: 32.8, strikeRate: 133.0, wickets: 38, economyRate: 7.8, catches: 18, runOuts: 7, momAwards:  9, basePrice: 25 },
    { fullName: 'Akash Bansal',      primaryRole: 'BATTER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'DOES_NOT_BOWL',       matchesPlayed: 32, runs: 1100, highestScore: 95, battingAverage: 42.3, strikeRate: 150.0, wickets:  0, economyRate: 0.0, catches:  8, runOuts: 3, momAwards:  8, basePrice: 25 },
    { fullName: 'Nikhil Pandey',     primaryRole: 'BOWLER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_FAST',      matchesPlayed: 25, runs:   60, highestScore: 12, battingAverage:  5.0, strikeRate:  70.0, wickets: 30, economyRate: 5.8, catches:  6, runOuts: 0, momAwards:  3, basePrice: 10 },
    { fullName: 'Vikram Choudhary',  primaryRole: 'ALL_ROUNDER',   battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_OFF_SPIN',  matchesPlayed: 36, runs:  680, highestScore: 58, battingAverage: 22.6, strikeRate: 118.0, wickets: 28, economyRate: 7.3, catches: 15, runOuts: 5, momAwards:  5, basePrice: 15 },
    { fullName: 'Rohan Shah',        primaryRole: 'BATTER',        battingStyle: 'LEFT_HAND',  bowlingStyle: 'DOES_NOT_BOWL',       matchesPlayed: 20, runs:  540, highestScore: 71, battingAverage: 30.0, strikeRate: 128.0, wickets:  0, economyRate: 0.0, catches:  7, runOuts: 2, momAwards:  3, basePrice: 10 },
    { fullName: 'Sanjay Reddy',      primaryRole: 'WICKET_KEEPER', battingStyle: 'RIGHT_HAND', bowlingStyle: 'DOES_NOT_BOWL',       matchesPlayed: 38, runs:  620, highestScore: 55, battingAverage: 21.4, strikeRate: 132.0, wickets:  0, economyRate: 0.0, catches: 52, runOuts:14, momAwards:  4, basePrice: 15 },
    { fullName: 'Gaurav Mishra',     primaryRole: 'BOWLER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_LEG_SPIN',  matchesPlayed: 30, runs:  120, highestScore: 18, battingAverage:  7.5, strikeRate:  82.0, wickets: 40, economyRate: 6.8, catches: 11, runOuts: 1, momAwards:  5, basePrice: 15 },
    { fullName: 'Harsh Kapoor',      primaryRole: 'BATTER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_MEDIUM',    matchesPlayed: 15, runs:  380, highestScore: 62, battingAverage: 28.0, strikeRate: 122.0, wickets:  5, economyRate: 8.5, catches:  5, runOuts: 1, momAwards:  2, basePrice: 10 },
    { fullName: 'Amit Saxena',       primaryRole: 'ALL_ROUNDER',   battingStyle: 'LEFT_HAND',  bowlingStyle: 'LEFT_ARM_ORTHODOX',   matchesPlayed: 28, runs:  520, highestScore: 48, battingAverage: 20.8, strikeRate: 115.0, wickets: 22, economyRate: 7.0, catches: 10, runOuts: 3, momAwards:  3, basePrice: 10 },
    { fullName: 'Rahul Jain',        primaryRole: 'BATTER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'DOES_NOT_BOWL',       matchesPlayed: 22, runs:  610, highestScore: 78, battingAverage: 33.0, strikeRate: 135.0, wickets:  0, economyRate: 0.0, catches:  9, runOuts: 2, momAwards:  4, basePrice: 15 },
    { fullName: 'Sumit Agarwal',     primaryRole: 'BOWLER',        battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_MEDIUM',    matchesPlayed: 18, runs:   80, highestScore: 16, battingAverage:  6.6, strikeRate:  75.0, wickets: 25, economyRate: 6.9, catches:  7, runOuts: 0, momAwards:  2, basePrice: 10 },
    { fullName: 'Kartik Pillai',     primaryRole: 'ALL_ROUNDER',   battingStyle: 'RIGHT_HAND', bowlingStyle: 'RIGHT_ARM_OFF_SPIN',  matchesPlayed: 45, runs: 1350, highestScore: 99, battingAverage: 40.9, strikeRate: 155.0, wickets: 55, economyRate: 6.4, catches: 25, runOuts: 8, momAwards: 14, basePrice: 30 },
  ];

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const raw = (p.runs / 10) + (p.wickets * 5) + (p.strikeRate / 10) +
      Math.max(0, (10 - p.economyRate) * 3) + (p.momAwards * 5);
    const acplRating = Math.min(100, Math.round(raw));
    const acplCategory = acplRating >= 85 ? 'Elite' : acplRating >= 75 ? 'A+' : acplRating >= 60 ? 'A' :
      acplRating >= 45 ? 'B+' : acplRating >= 30 ? 'B' : 'C';

    await prisma.player.upsert({
      where: { fullName: p.fullName },
      update: {},
      create: { ...p, status: 'APPROVED', acplRating, acplCategory, auctionOrder: i + 1 },
    });
  }
  console.log(`Players: ${players.length} seeded`);

  // ---------- Auction Session ----------
  await prisma.auctionSession.upsert({
    where: { id: 'default-session' },
    update: {},
    create: { id: 'default-session', name: 'ACPL 3 Player Auction', status: 'SCHEDULED', timerSeconds: 30, bidIncrement: 1 },
  });
  console.log('AuctionSession: default-session ready');

  console.log('\nSeed complete!');
  console.log('  Admin:    admin@acpl3.com   / Admin@123');
  console.log('  Captain1: captain1@acpl3.com / Captain@123');
  console.log('  Captain2: captain2@acpl3.com / Captain@123');
  console.log('  Captain3: captain3@acpl3.com / Captain@123');
  console.log('  Captain4: captain4@acpl3.com / Captain@123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
