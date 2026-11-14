/**
 * LOCAL DEMO DATA — never run against production.
 *
 *   npm run db:seed        # schools (run first)
 *   npm run db:seed:demo   # this file
 *
 * Re-runnable: deletes and recreates everything owned by the demo accounts
 * (emails ending @example.test) and by the local test account below.
 */
import fs from 'fs';
import path from 'path';
import {
  PrismaClient,
  Board,
  BookCondition,
  Category,
  DealStatus,
  GrievanceStatus,
  ListingStatus,
  NotificationChannel,
  NotificationType,
  PaperType,
  PickupLocation,
  RequestStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo data with NODE_ENV=production.');
  process.exit(1);
}

const TEST_EMAIL = (process.env.DEV_LOGIN_EMAILS || 'mohanpruthi33@gmail.com').split(',')[0].trim();

// Freely licensed Unsplash photos (Unsplash License), used as sample listing photos.
const PHOTO = {
  stack: 'https://images.unsplash.com/photo-1686161238569-f32e92b6c363?auto=format&fit=crop&w=800&h=600&q=70',
  pencils: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&h=600&q=70',
  booksPen: 'https://images.unsplash.com/photo-1643222797501-fa6f15af1037?auto=format&fit=crop&w=800&h=600&q=70',
};

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function wipe(userIds: string[]) {
  const listingIds = (await prisma.listing.findMany({ where: { userId: { in: userIds } }, select: { id: true } })).map(
    (l) => l.id,
  );
  await prisma.deal.deleteMany({
    where: { OR: [{ sellerId: { in: userIds } }, { buyerId: { in: userIds } }, { listingId: { in: listingIds } }] },
  });
  await prisma.listingImage.deleteMany({ where: { listingId: { in: listingIds } } });
  await prisma.listingItem.deleteMany({ where: { listingId: { in: listingIds } } });
  await prisma.listing.deleteMany({ where: { id: { in: listingIds } } });
  await prisma.request.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.paper.deleteMany({ where: { uploadedById: { in: userIds } } });
  await prisma.grievance.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.child.deleteMany({ where: { userId: { in: userIds } } });
}

async function main() {
  const school = async (name: string) => {
    const s = await prisma.school.findFirst({ where: { name } });
    if (!s) throw new Error(`School "${name}" missing — run npm run db:seed first.`);
    return s;
  };
  const nps = await school('National Public School, Indiranagar');
  const dps = await school('Delhi Public School, Bangalore South');
  const bishop = await school("Bishop Cotton Boys' School");
  const inventure = await school('Inventure Academy');
  const bombay = await school('Bombay Scottish School');
  const podar = await school('Podar International School');
  const modern = await school('Modern School, Barakhamba Road');

  // ---------- Users ----------
  const existing = await prisma.user.findMany({
    where: { OR: [{ email: { endsWith: '@example.test' } }, { email: TEST_EMAIL }] },
    select: { id: true },
  });
  await wipe(existing.map((u) => u.id));

  const me = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: { name: 'Mohan Pruthi', city: 'Bangalore', board: Board.CBSE, schoolId: nps.id, isVerified: true, isAdmin: true },
    create: {
      name: 'Mohan Pruthi',
      email: TEST_EMAIL,
      phone: '+919000000001',
      city: 'Bangalore',
      address: '12th Main, Indiranagar',
      board: Board.CBSE,
      schoolId: nps.id,
      isVerified: true,
      isAdmin: true,
    },
  });

  const parentsData = [
    { name: 'Ananya Rao', email: 'ananya@example.test', phone: '+919000000011', city: 'Bangalore', board: Board.CBSE, schoolId: dps.id, address: 'JP Nagar 6th Phase' },
    { name: 'Rahul Mehta', email: 'rahul@example.test', phone: '+919000000012', city: 'Bangalore', board: Board.ICSE, schoolId: bishop.id, address: 'Richmond Town' },
    { name: 'Farah Khan', email: 'farah@example.test', phone: '+919000000013', city: 'Bangalore', board: Board.IGCSE, schoolId: inventure.id, address: 'Whitefield' },
    { name: 'Vikram Iyer', email: 'vikram@example.test', phone: '+919000000014', city: 'Mumbai', board: Board.ICSE, schoolId: bombay.id, address: 'Mahim West' },
    { name: 'Neha Gupta', email: 'neha@example.test', phone: '+919000000015', city: 'Mumbai', board: Board.CBSE, schoolId: podar.id, address: 'Santacruz East' },
    { name: 'Arjun Singh', email: 'arjun@example.test', phone: '+919000000016', city: 'Delhi', board: Board.CBSE, schoolId: modern.id, address: 'Connaught Place' },
  ];
  const parents: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  for (const p of parentsData) {
    parents[p.email.split('@')[0]] = await prisma.user.upsert({
      where: { email: p.email },
      update: { ...p, isVerified: true },
      create: { ...p, isVerified: true },
    });
  }
  const { ananya, rahul, farah, vikram, neha, arjun } = parents;

  await prisma.child.create({ data: { userId: me.id, name: 'Kabir', gender: 'M', currentClass: 6, schoolId: nps.id } });

  // ---------- Listings ----------
  type L = {
    by: { id: string };
    title: string;
    description?: string;
    category?: Category;
    board?: Board;
    cls?: number;
    subject?: string;
    schoolId?: string;
    city: string;
    sector?: string;
    pickup?: PickupLocation;
    condition: BookCondition;
    mrp?: number;
    price: number;
    status?: ListingStatus;
    photo?: string;
    age: number;
    items?: string[];
  };
  const L = async (l: L) =>
    prisma.listing.create({
      data: {
        userId: l.by.id,
        title: l.title,
        description: l.description,
        category: l.category ?? Category.BOOK,
        board: l.board,
        class: l.cls,
        subject: l.subject,
        schoolId: l.schoolId,
        city: l.city,
        sector: l.sector,
        pickupLocation: l.pickup ?? PickupLocation.SCHOOL_GATE,
        yearOfPurchase: 2025,
        condition: l.condition,
        buyingPrice: l.mrp,
        sellingPrice: l.price,
        status: l.status ?? ListingStatus.ACTIVE,
        createdAt: daysAgo(l.age),
        items: l.items ? { create: l.items.map((subject) => ({ subject })) } : undefined,
        images: l.photo ? { create: [{ imageUrl: l.photo, imageType: 'FRONT' }] } : undefined,
      },
    });

  const sci6 = await L({ by: ananya, title: 'Science NCERT, Class 6', description: 'Covered in brown paper, a few pencil notes in chapter 3.', board: Board.CBSE, cls: 6, subject: 'Science', schoolId: dps.id, city: 'Bangalore', sector: 'JP Nagar', condition: BookCondition.WELL_MAINTAINED, mrp: 360, price: 160, photo: PHOTO.booksPen, age: 1 });
  const set6 = await L({ by: ananya, title: 'Full Class 6 CBSE set (5 books)', description: 'English, Maths, Science, Social studies and Hindi. All from this year.', board: Board.CBSE, cls: 6, schoolId: dps.id, city: 'Bangalore', sector: 'JP Nagar', condition: BookCondition.HARDLY_USED, mrp: 1480, price: 650, photo: PHOTO.stack, age: 2, items: ['English', 'Maths', 'Science', 'Social studies', 'Hindi'] });
  const maths8 = await L({ by: rahul, title: 'ICSE Maths (Selina), Class 8', board: Board.ICSE, cls: 8, subject: 'Maths', schoolId: bishop.id, city: 'Bangalore', sector: 'Richmond Town', condition: BookCondition.MARKER_USED, mrp: 540, price: 220, age: 3 });
  await L({ by: rahul, title: 'Physics, Class 9 ICSE', board: Board.ICSE, cls: 9, subject: 'Physics', schoolId: bishop.id, city: 'Bangalore', condition: BookCondition.WELL_MAINTAINED, mrp: 495, price: 210, age: 4 });
  await L({ by: farah, title: 'English grammar and composition, Class 7', board: Board.CBSE, cls: 7, subject: 'English', city: 'Bangalore', sector: 'Whitefield', pickup: PickupLocation.PUBLIC, condition: BookCondition.HARDLY_USED, mrp: 420, price: 180, photo: PHOTO.stack, age: 1 });
  await L({ by: farah, title: 'IGCSE Biology coursebook, Class 9', board: Board.IGCSE, cls: 9, subject: 'Biology', schoolId: inventure.id, city: 'Bangalore', condition: BookCondition.HARDLY_USED, mrp: 1650, price: 800, age: 5 });
  await L({ by: farah, title: 'Oxford school atlas', board: Board.CBSE, cls: 7, subject: 'Geography', city: 'Bangalore', condition: BookCondition.STAINS, mrp: 380, price: 120, age: 6 });
  await L({ by: vikram, title: 'English reader and workbook, Class 5', board: Board.ICSE, cls: 5, subject: 'English', schoolId: bombay.id, city: 'Mumbai', sector: 'Mahim', condition: BookCondition.WELL_MAINTAINED, mrp: 480, price: 200, age: 2 });
  await L({ by: vikram, title: 'Hindi Vyakaran, Class 7', board: Board.ICSE, cls: 7, subject: 'Hindi', schoolId: bombay.id, city: 'Mumbai', condition: BookCondition.WELL_MAINTAINED, mrp: 260, price: 100, age: 8 });
  await L({ by: neha, title: 'Class 10 CBSE Science and Maths', board: Board.CBSE, cls: 10, schoolId: podar.id, city: 'Mumbai', sector: 'Santacruz', condition: BookCondition.MARKER_USED, mrp: 700, price: 300, photo: PHOTO.booksPen, age: 3, items: ['Science', 'Maths'] });
  await L({ by: neha, title: 'Biology, Class 9 CBSE', board: Board.CBSE, cls: 9, subject: 'Biology', schoolId: podar.id, city: 'Mumbai', condition: BookCondition.WELL_MAINTAINED, mrp: 380, price: 160, age: 9 });
  await L({ by: arjun, title: 'Class 3 CBSE full set', board: Board.CBSE, cls: 3, schoolId: modern.id, city: 'Delhi', condition: BookCondition.WELL_MAINTAINED, mrp: 980, price: 420, age: 4, items: ['English', 'Maths', 'EVS', 'Hindi'] });
  await L({ by: arjun, title: 'Social studies, Class 8 CBSE', board: Board.CBSE, cls: 8, subject: 'Social studies', schoolId: modern.id, city: 'Delhi', condition: BookCondition.TORN_PAGES, mrp: 350, price: 90, age: 12 });

  // Waiting for admin review
  await L({ by: rahul, title: 'Chemistry, Class 10 ICSE', board: Board.ICSE, cls: 10, subject: 'Chemistry', schoolId: bishop.id, city: 'Bangalore', condition: BookCondition.WELL_MAINTAINED, mrp: 520, price: 230, status: ListingStatus.PENDING_APPROVAL, age: 0 });
  await L({ by: neha, title: 'Geography, Class 8 CBSE', board: Board.CBSE, cls: 8, subject: 'Geography', schoolId: podar.id, city: 'Mumbai', condition: BookCondition.HARDLY_USED, mrp: 340, price: 140, status: ListingStatus.PENDING_APPROVAL, photo: PHOTO.booksPen, age: 0 });

  // The test account's own listings
  const myEng5 = await L({ by: me, title: 'English Honeysuckle and workbook, Class 5', board: Board.CBSE, cls: 5, subject: 'English', schoolId: nps.id, city: 'Bangalore', sector: 'Indiranagar', condition: BookCondition.WELL_MAINTAINED, mrp: 420, price: 180, age: 5 });
  await L({ by: me, title: 'Class 5 CBSE Maths and EVS', board: Board.CBSE, cls: 5, schoolId: nps.id, city: 'Bangalore', sector: 'Indiranagar', condition: BookCondition.HARDLY_USED, mrp: 640, price: 280, age: 6, items: ['Maths', 'EVS'] });
  await L({ by: me, title: 'Hindi Vasant, Class 5', board: Board.CBSE, cls: 5, subject: 'Hindi', schoolId: nps.id, city: 'Bangalore', condition: BookCondition.WELL_MAINTAINED, mrp: 200, price: 80, status: ListingStatus.PENDING_APPROVAL, age: 0 });
  const mySold = await L({ by: me, title: 'Class 4 CBSE workbook bundle', board: Board.CBSE, cls: 4, schoolId: nps.id, city: 'Bangalore', condition: BookCondition.WELL_MAINTAINED, mrp: 560, price: 240, status: ListingStatus.SOLD, age: 30 });

  // ---------- Deals ----------
  let n = 1001;
  const D = (listing: { id: string; userId: string; sellingPrice: number }, buyer: { id: string }, status: DealStatus, age: number) =>
    prisma.deal.create({
      data: {
        code: `SYB-${n++}`,
        listingId: listing.id,
        sellerId: listing.userId,
        buyerId: buyer.id,
        agreedPrice: listing.sellingPrice,
        status,
        createdAt: daysAgo(age),
      },
    });

  await D(myEng5, ananya, DealStatus.PENDING, 0); // needs your reply
  await D(sci6, me, DealStatus.PENDING, 1); // you're waiting on a seller
  await D(set6, me, DealStatus.ACCEPTED, 2); // contact details revealed
  await D(mySold, rahul, DealStatus.COMPLETED, 25);
  await D(maths8, farah, DealStatus.PENDING, 1);

  // ---------- Requests ----------
  await prisma.request.create({ data: { userId: me.id, board: Board.CBSE, class: 6, subjects: ['Sanskrit'], city: 'Bangalore', schoolId: nps.id, maxPrice: 150, status: RequestStatus.OPEN } });
  await prisma.request.create({ data: { userId: vikram.id, board: Board.ICSE, class: 8, subjects: ['Maths', 'Physics'], city: 'Mumbai', maxPrice: 500, status: RequestStatus.OPEN } });
  await prisma.request.create({ data: { userId: arjun.id, board: Board.CBSE, class: 9, subjects: ['Science'], city: 'Delhi', status: RequestStatus.PENDING_APPROVAL } });

  // ---------- Notifications for the test account ----------
  const note = (type: NotificationType, title: string, body: string, age: number, isRead = false, data?: object) =>
    prisma.notification.create({
      data: { userId: me.id, type, channel: NotificationChannel.PUSH, title, body, isRead, sentAt: daysAgo(age), data },
    });
  await note(NotificationType.DEAL_REQUESTED, 'New request for your listing', 'Ananya Rao requested "English Honeysuckle and workbook, Class 5".', 0);
  await note(NotificationType.DEAL_ACCEPTED, 'Your request was accepted', 'Ananya Rao accepted your request for the full Class 6 CBSE set. Contact details are now on the deal.', 2);
  await note(NotificationType.LISTING_SUBMITTED, 'Listing sent for review', '"Hindi Vasant, Class 5" will go live once our team checks it.', 0);
  await note(NotificationType.LISTING_APPROVED, 'Your listing is live', '"Class 5 CBSE Maths and EVS" is now visible to other parents.', 6, true);
  await note(NotificationType.DEAL_COMPLETED, 'Hand-over complete', 'Your Class 4 workbook bundle has started its next term.', 25, true);

  // ---------- Exam papers (a tiny sample PDF) ----------
  const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const pdfName = 'demo-sample-paper.pdf';
  fs.writeFileSync(
    path.join(uploadDir, pdfName),
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj 4 0 obj<</Length 44>>stream\nBT /F1 18 Tf 30 70 Td (Sample exam paper) Tj ET\nendstream endobj 5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  );
  const paper = (title: string, subject: string, board: Board, cls: number, year: number, type: PaperType, by: { id: string }, downloads: number) =>
    prisma.paper.create({ data: { title, subject, board, class: cls, year, type, fileUrl: `/uploads/${pdfName}`, downloadCount: downloads, uploadedById: by.id } });
  await paper('Class 10 Maths annual exam 2025', 'Maths', Board.CBSE, 10, 2025, PaperType.ANNUAL_EXAM, neha, 42);
  await paper('Class 8 Science half-yearly 2025', 'Science', Board.ICSE, 8, 2025, PaperType.HALF_YEARLY, rahul, 17);
  await paper('Class 6 English unit test 2024', 'English', Board.CBSE, 6, 2024, PaperType.UNIT_TEST, me, 5);

  // ---------- Grievances ----------
  await prisma.grievance.create({ data: { userId: ananya.id, transactionCode: 'SYB-1004', subject: 'Seller didn\'t turn up', description: 'We agreed to meet at the school gate at 3pm but the seller didn\'t come.', status: GrievanceStatus.OPEN } });
  await prisma.grievance.create({ data: { userId: vikram.id, subject: 'Wrong class listed', description: 'A listing says Class 7 but the book is for Class 6.', status: GrievanceStatus.RESOLVED } });

  const counts = await Promise.all([
    prisma.user.count({ where: { OR: [{ email: { endsWith: '@example.test' } }, { email: TEST_EMAIL }] } }),
    prisma.listing.count(),
    prisma.deal.count(),
  ]);
  console.log(`Demo data ready: ${counts[0]} users, ${counts[1]} listings, ${counts[2]} deals. Test login: ${TEST_EMAIL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
