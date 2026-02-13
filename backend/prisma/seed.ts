import { PrismaClient, Board } from '@prisma/client';

const prisma = new PrismaClient();

const schools = [
  // Delhi
  { name: 'Delhi Public School, R.K. Puram', city: 'Delhi', board: Board.CBSE, address: 'R.K. Puram, New Delhi' },
  { name: 'Modern School, Barakhamba Road', city: 'Delhi', board: Board.CBSE, address: 'Barakhamba Road, New Delhi' },
  { name: 'Sanskriti School', city: 'Delhi', board: Board.CBSE, address: 'Chanakyapuri, New Delhi' },
  { name: 'The Mother\'s International School', city: 'Delhi', board: Board.CBSE, address: 'Sri Aurobindo Marg, New Delhi' },
  { name: 'Springdales School', city: 'Delhi', board: Board.CBSE, address: 'Pusa Road, New Delhi' },

  // Mumbai
  { name: 'Dhirubhai Ambani International School', city: 'Mumbai', board: Board.IB, address: 'BKC, Mumbai' },
  { name: 'Cathedral and John Connon School', city: 'Mumbai', board: Board.ICSE, address: 'Fort, Mumbai' },
  { name: 'Bombay Scottish School', city: 'Mumbai', board: Board.ICSE, address: 'Mahim, Mumbai' },
  { name: 'Podar International School', city: 'Mumbai', board: Board.CBSE, address: 'Santacruz, Mumbai' },
  { name: 'Ryan International School', city: 'Mumbai', board: Board.ICSE, address: 'Kandivali, Mumbai' },

  // Bangalore
  { name: 'Bishop Cotton Boys\' School', city: 'Bangalore', board: Board.ICSE, address: 'St Marks Road, Bangalore' },
  { name: 'National Public School, Indiranagar', city: 'Bangalore', board: Board.CBSE, address: 'Indiranagar, Bangalore' },
  { name: 'Delhi Public School, Bangalore South', city: 'Bangalore', board: Board.CBSE, address: 'Kanakapura Road, Bangalore' },
  { name: 'Inventure Academy', city: 'Bangalore', board: Board.IGCSE, address: 'Whitefield, Bangalore' },
  { name: 'Greenwood High International School', city: 'Bangalore', board: Board.CBSE, address: 'Sarjapur Road, Bangalore' },

  // Hyderabad
  { name: 'Hyderabad Public School', city: 'Hyderabad', board: Board.CBSE, address: 'Begumpet, Hyderabad' },
  { name: 'Oakridge International School', city: 'Hyderabad', board: Board.IB, address: 'Gachibowli, Hyderabad' },
  { name: 'Chirec International School', city: 'Hyderabad', board: Board.CBSE, address: 'Kondapur, Hyderabad' },
  { name: 'Delhi Public School, Nacharam', city: 'Hyderabad', board: Board.CBSE, address: 'Nacharam, Hyderabad' },

  // Chennai
  { name: 'Padma Seshadri Bala Bhavan', city: 'Chennai', board: Board.CBSE, address: 'T Nagar, Chennai' },
  { name: 'DAV Public School', city: 'Chennai', board: Board.CBSE, address: 'Gopalapuram, Chennai' },
  { name: 'Chettinad Vidyashram', city: 'Chennai', board: Board.CBSE, address: 'RA Puram, Chennai' },
  { name: 'Sishya School', city: 'Chennai', board: Board.ICSE, address: 'Adyar, Chennai' },

  // Pune
  { name: 'The Bishop\'s School', city: 'Pune', board: Board.ICSE, address: 'Camp, Pune' },
  { name: 'Symbiosis International School', city: 'Pune', board: Board.IB, address: 'Viman Nagar, Pune' },
  { name: 'Delhi Public School, Pune', city: 'Pune', board: Board.CBSE, address: 'Hinjewadi, Pune' },

  // Kolkata
  { name: 'La Martiniere for Boys', city: 'Kolkata', board: Board.ICSE, address: 'Park Street, Kolkata' },
  { name: 'South Point High School', city: 'Kolkata', board: Board.STATE, address: 'Mandeville Gardens, Kolkata' },
  { name: 'Delhi Public School, Ruby Park', city: 'Kolkata', board: Board.CBSE, address: 'Ruby Park, Kolkata' },

  // Jaipur
  { name: 'Maharaja Sawai Man Singh Vidyalaya', city: 'Jaipur', board: Board.CBSE, address: 'Jaipur' },
  { name: 'St Xavier\'s School', city: 'Jaipur', board: Board.ICSE, address: 'Nevta, Jaipur' },
];

async function main() {
  console.log('Seeding schools...');

  let created = 0;
  for (const school of schools) {
    const existing = await prisma.school.findFirst({
      where: { name: school.name, city: school.city },
    });
    if (!existing) {
      await prisma.school.create({ data: { ...school, isVerified: true } });
      created++;
    }
  }

  console.log(`Seeded ${created} new schools (${schools.length} total in seed)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
