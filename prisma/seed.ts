// prisma/seed.ts


import dotenv from "dotenv";
dotenv.config();

import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";


async function main() {
  console.log('Start seeding...');

  const hashedPassword = await bcrypt.hash("Sl@bcc2015", 10);
 await prisma.user.deleteMany();
  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        password: hashedPassword,
        role: Role.ADMIN,
      },
      {
        username: "staff",
        password: hashedPassword,
        role: Role.STAFF,
      },
    ],
  });

  console.log("✅ Users created");



  // ============================================
  // 1. Create Schools
  // ============================================
  const schoolIds = [1, 3, 4, 5, 7, 8, 11, 16, 18, 19, 20, 23, 24];
  
  await prisma.school.createMany({
    data: schoolIds.map(id => ({ id, name: `School ${id}` })),
    skipDuplicates: true,
  });
  console.log('Schools created!');

  // ============================================
  // 2. Create Batches
  // ============================================
  const batches = [
    { id: 1, code: 61, classId: 'Six', name: '6A' },
    { id: 2, code: 63, classId: 'Six', name: '6C' },
    { id: 3, code: 71, classId: 'Seven', name: '7A' },
    { id: 4, code: 73, classId: 'Seven', name: '7C' },
    { id: 5, code: 81, classId: 'Eight', name: '8A' },
    { id: 6, code: 82, classId: 'Eight', name: '8B' },
    { id: 7, code: 83, classId: 'Eight', name: '8C' },
    { id: 8, code: 91, classId: 'Nine', name: '9A' },
    { id: 9, code: 92, classId: 'Nine', name: '9B' },
    { id: 10, code: 93, classId: 'Nine', name: '9C' },
    { id: 11, code: 101, classId: 'Ten', name: '10A' },
    { id: 12, code: 103, classId: 'Ten', name: '10C' },
  ];

  await prisma.batch.createMany({
    data: batches,
    skipDuplicates: true,
  });
  console.log('Batches created!');

  // ============================================
  // 3. Create Students (All 203)
  // ============================================
  
  // Batch ID mapping: batchid (SQL) -> batch.id (Prisma)
  const batchIdMap: Record<string, number> = {
    '61': 1, '63': 2, '71': 3, '73': 4,
    '81': 5, '82': 6, '83': 7, '91': 8,
    '92': 9, '93': 10, '101': 11, '103': 12,
  };

  const students = [
    // ==================== CLASS SIX ====================
    // Batch 61 (13 students)
    { name: 'Nusaifa Mehkash', fatherName: 'Imtiaz Ahmed Pinaki', motherName: 'Shorna', mobile: '01716083055', homeMobile: '', schoolId: 3, batchId: 1, roll: 1, address: '7no ward, Trishal', gender: 'Female', class: 'Six' },
    { name: 'Mahjabin Akter Jaima', fatherName: 'Md. Sujon', motherName: 'Mala', mobile: '01733162778', homeMobile: '', schoolId: 18, batchId: 1, roll: 2, address: 'Birrampur Ujanpara', gender: 'Female', class: 'Six' },
    { name: 'Israt Jahan Efti', fatherName: 'Romjan Ali', motherName: 'Satu', mobile: '01730831756', homeMobile: '', schoolId: 1, batchId: 1, roll: 3, address: '9 no word', gender: 'Female', class: 'Six' },
    { name: 'Sumaeya Akter', fatherName: 'Md. Ajaharul Islam', motherName: 'Ruksana Akter', mobile: '01815164003', homeMobile: '01403333234', schoolId: 18, batchId: 1, roll: 4, address: 'Trishal', gender: 'Female', class: 'Six' },
    { name: 'Nusrat Jahan Faiza', fatherName: 'Md. Shohag Mia', motherName: 'Nasima Khatun', mobile: '01737482725', homeMobile: '', schoolId: 18, batchId: 1, roll: 5, address: 'Bailarper, Trishal', gender: 'Female', class: 'Six' },
    { name: 'Nawshin Tabassum', fatherName: 'Rajib Ahmed', motherName: 'Arifa Akter', mobile: '01611707690', homeMobile: '', schoolId: 1, batchId: 1, roll: 6, address: '9no ward, Trishal', gender: 'Female', class: 'Six' },
    { name: 'Sara Jahan Adeeba', fatherName: 'Asadujjaman', motherName: 'Samima', mobile: '01718262123', homeMobile: '', schoolId: 1, batchId: 1, roll: 7, address: '4no ward, Trishal', gender: 'Female', class: 'Six' },
    { name: 'Lamiya Noushin', fatherName: 'Rejuwan Ali', motherName: 'Sumaiya Hoque', mobile: '01778195915', homeMobile: '', schoolId: 18, batchId: 1, roll: 8, address: 'Kakchor', gender: 'Female', class: 'Six' },
    { name: 'Faika Jannat Naumi', fatherName: 'Md. Ala Uddin', motherName: 'Mst. Ruksana Jahan', mobile: '01926530773', homeMobile: '', schoolId: 1, batchId: 1, roll: 9, address: '9no ward, Trishal', gender: 'Female', class: 'Six' },
    { name: 'Usha Binte Mubarak', fatherName: 'Md. Mubarak Hossain', motherName: 'Runa', mobile: '01913659314', homeMobile: '', schoolId: 18, batchId: 1, roll: 10, address: '4no ward, Trishal', gender: 'Female', class: 'Six' },
    { name: 'Mst. Subhe Anam Megha', fatherName: 'Md. Mahatab Ali', motherName: 'Mst. Kolpona Akter', mobile: '01352021144', homeMobile: '', schoolId: 1, batchId: 1, roll: 11, address: 'Trishal', gender: 'Female', class: 'Six' },
    { name: 'Enaiya Farha Upoma', fatherName: 'Md. Yousuf', motherName: 'Samima Akter', mobile: '01710599318', homeMobile: '', schoolId: 1, batchId: 1, roll: 12, address: '8no ward, Trishal', gender: 'Female', class: 'Six' },
    { name: 'Abiya Anaum Iffa', fatherName: 'Md. Anamul Hoque', motherName: 'Mahfujur Nahar', mobile: '01789131414', homeMobile: '01711589941', schoolId: 1, batchId: 1, roll: 13, address: 'Lekerper, Trishal', gender: 'Female', class: 'Six' },
    
    // Batch 63 (12 students)
    { name: 'Md. Yasin Mahmud Farazi', fatherName: 'Md. Rohul Amin', motherName: 'Mst. Helena', mobile: '01715900081', homeMobile: '01856540864', schoolId: 1, batchId: 2, roll: 1, address: '9no ward, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Abdullah Al Mamun', fatherName: 'Md. Ajijul Haque', motherName: 'Habiba Akter Sonia', mobile: '01782025040', homeMobile: '', schoolId: 1, batchId: 2, roll: 2, address: '4no ward, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Mojaeid Billah', fatherName: 'Md. Masum Billah', motherName: 'Lutfor Nahar', mobile: '01676080667', homeMobile: '01326497392', schoolId: 1, batchId: 2, roll: 3, address: 'Boilor, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Tayeb Wahid', fatherName: 'Wahiduzzaman', motherName: 'sweety', mobile: '01604837090', homeMobile: '', schoolId: 1, batchId: 2, roll: 4, address: 'Dorirampur 9no word', gender: 'Male', class: 'Six' },
    { name: 'Ibn Sina Inan', fatherName: 'Manik Mia', motherName: 'Mila', mobile: '01744158469', homeMobile: '', schoolId: 4, batchId: 2, roll: 5, address: 'Kakchor', gender: 'Male', class: 'Six' },
    { name: 'Shopno Chowdhury', fatherName: 'Bikash', motherName: 'Shrity', mobile: '01762143120', homeMobile: '', schoolId: 1, batchId: 2, roll: 6, address: '9no ward, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Md. Abdullah Al Hasan', fatherName: 'Md. Abu Raihan', motherName: 'Mst. Rabeya', mobile: '01749584542', homeMobile: '', schoolId: 20, batchId: 2, roll: 7, address: '2no ward, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Tawhid', fatherName: 'Md. Sintho Mia', motherName: 'Sajiya Akter', mobile: '01775982752', homeMobile: '', schoolId: 20, batchId: 2, roll: 8, address: '5 no ward, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Tauhid Al Ahad', fatherName: 'Md. Kamal', motherName: 'Afsana', mobile: '01909805734', homeMobile: '', schoolId: 20, batchId: 2, roll: 9, address: 'Trishal', gender: 'Male', class: 'Six' },
    { name: 'Samiu Al Sami', fatherName: 'Asadul Haque', motherName: 'Halima Khatun', mobile: '01749606956', homeMobile: '', schoolId: 1, batchId: 2, roll: 10, address: '4no ward, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Abdullah Al Mahmud', fatherName: 'Habibur Rahman', motherName: 'Hosneara', mobile: '01834758359', homeMobile: '', schoolId: 1, batchId: 2, roll: 11, address: '4no ward, Trishal', gender: 'Male', class: 'Six' },
    { name: 'Sree Sonjoy Robi Das', fatherName: 'Sri Liton', motherName: 'Lolita', mobile: '01740821321', homeMobile: '', schoolId: 1, batchId: 2, roll: 12, address: '9no ward, Trishal', gender: 'Male', class: 'Six' },

    // ==================== CLASS SEVEN ====================
    // Batch 71 (37 students)
    { name: 'Nazifa Tabassum Moume', fatherName: 'Nazmul Hossain', motherName: 'Roji', mobile: '01774897008', homeMobile: '', schoolId: 18, batchId: 3, roll: 1, address: '4 no word', gender: 'Female', class: 'Seven' },
    { name: 'Humayra Gulshan Toha', fatherName: 'Homayon', motherName: 'Birkish', mobile: '01732529608', homeMobile: '', schoolId: 19, batchId: 3, roll: 2, address: 'Rampur', gender: 'Female', class: 'Seven' },
    { name: 'Mabia Akter', fatherName: 'Mojammal', motherName: 'Rahima', mobile: '01745877981', homeMobile: '', schoolId: 1, batchId: 3, roll: 3, address: 'Boilor Corpara', gender: 'Female', class: 'Seven' },
    { name: 'Fatema Tahsina Naba', fatherName: 'Mahmudul Hasan', motherName: 'Jannatul Ferdous', mobile: '01670711391', homeMobile: '', schoolId: 18, batchId: 3, roll: 4, address: 'Dorirampur', gender: 'Female', class: 'Seven' },
    { name: 'Ritika Islam Towa', fatherName: 'Rabiul Islam', motherName: 'Farhana', mobile: '01336750532', homeMobile: '', schoolId: 4, batchId: 3, roll: 5, address: 'Dorirampur', gender: 'Female', class: 'Seven' },
    { name: 'Rifa Binte Zaman', fatherName: 'Rasal', motherName: 'Jannatul Ferdous', mobile: '01753154300', homeMobile: '', schoolId: 18, batchId: 3, roll: 6, address: 'Dorirampur 4 no word', gender: 'Female', class: 'Seven' },
    { name: 'Sumiya Akter Riya', fatherName: 'Shaded', motherName: 'Safali Akter', mobile: '01956646452', homeMobile: '01720196705', schoolId: 18, batchId: 3, roll: 7, address: 'Ujanpara 2 no word', gender: 'Female', class: 'Seven' },
    { name: 'Sadia Akter', fatherName: 'Jalal Uddin', motherName: 'Orpi', mobile: '01608511318', homeMobile: '', schoolId: 20, batchId: 3, roll: 8, address: 'Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Maria jaman Tasnim', fatherName: 'Minto', motherName: 'Horejannt', mobile: '01795853686', homeMobile: '', schoolId: 1, batchId: 3, roll: 9, address: 'Nowder laker par 6 no word', gender: 'Female', class: 'Seven' },
    { name: 'Faria Jaman Tasfia', fatherName: 'Minto', motherName: 'Horejannt', mobile: '01795853686', homeMobile: '', schoolId: 1, batchId: 3, roll: 10, address: 'Nowder laker par 6 no word', gender: 'Female', class: 'Seven' },
    { name: 'Habiba Tabassum Soa', fatherName: 'Md. Habibur Rahman', motherName: 'Ayesha Akhter', mobile: '01764364692', homeMobile: '', schoolId: 18, batchId: 3, roll: 11, address: 'Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Umme Habiba', fatherName: 'Md. Dulon', motherName: 'Mst. Rumela', mobile: '01719978047', homeMobile: '01308106481', schoolId: 1, batchId: 3, roll: 12, address: '9no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Moniya Akter', fatherName: 'Md. Rukon Uddin', motherName: 'Rehena Begum', mobile: '01811527465', homeMobile: '', schoolId: 1, batchId: 3, roll: 13, address: '9no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Fatiha Tasnim', fatherName: 'Md. Fojlur Rahman', motherName: 'Rajia Sultana', mobile: '01313970518', homeMobile: '', schoolId: 18, batchId: 3, roll: 14, address: '9no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Mitu Akter', fatherName: 'Ajijul Haque', motherName: 'Fahima Khatun', mobile: '01671029864', homeMobile: '', schoolId: 1, batchId: 3, roll: 15, address: 'Bagan, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Takiya Taskin', fatherName: 'Md. Tohidul Anis', motherName: 'Lutfor Nahar', mobile: '01719300301', homeMobile: '', schoolId: 1, batchId: 3, roll: 16, address: '9no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Malkin Forazi Disha', fatherName: 'Dr. Abdul Malek Forazi', motherName: 'Rukeya', mobile: '01745799985', homeMobile: '', schoolId: 1, batchId: 3, roll: 17, address: '9no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Mst. Marjia Akter', fatherName: 'Md. Ajijul Haque', motherName: 'Mst. Shorifa Khatun', mobile: '01322629849', homeMobile: '', schoolId: 1, batchId: 3, roll: 18, address: 'Boilor, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Shabiha Sultana Liya', fatherName: 'Md. Sadekur Rahman', motherName: 'Mst. Lutfurnahar', mobile: '01718293996', homeMobile: '', schoolId: 18, batchId: 3, roll: 19, address: '3no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Mst. Jakiya Jyoti', fatherName: 'Md. Saidujjaman', motherName: 'Mst. Amina Khatun', mobile: '01729957980', homeMobile: '', schoolId: 18, batchId: 3, roll: 20, address: 'Danikula, Corkumaria, Bilpar', gender: 'Female', class: 'Seven' },
    { name: 'Mawa Binte Thuhin', fatherName: 'Al Thuhin', motherName: 'Rita', mobile: '01710856901', homeMobile: '01782706653', schoolId: 3, batchId: 3, roll: 21, address: '9 no word', gender: 'Female', class: 'Seven' },
    { name: 'Taslima Akter Mim', fatherName: 'Md. Taijul Islam', motherName: 'Mst. Paki Akter', mobile: '01754488875', homeMobile: '', schoolId: 18, batchId: 3, roll: 22, address: '4no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Zarin Hadika', fatherName: 'Hafizur Rahmna', motherName: 'Lopa', mobile: '01742175196', homeMobile: '01712337616', schoolId: 18, batchId: 3, roll: 23, address: 'Chakna Monohore', gender: 'Female', class: 'Seven' },
    { name: 'Rabia Bosri Mahi', fatherName: 'Md. Anawer Hossain', motherName: 'Mohosina', mobile: '01711878560', homeMobile: '', schoolId: 16, batchId: 3, roll: 24, address: '8 no word', gender: 'Female', class: 'Seven' },
    { name: 'Adila Afrose Galiba', fatherName: 'Md. Musharrof Hossain', motherName: 'Saima Sultana', mobile: '01739671270', homeMobile: '', schoolId: 18, batchId: 3, roll: 25, address: '2no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Tasfiya Islam Taisha', fatherName: 'Tohidul Islam', motherName: 'Umme Salma', mobile: '01741705320', homeMobile: '', schoolId: 18, batchId: 3, roll: 26, address: '4no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Samiha Tasnim', fatherName: 'Md. Nurul Halim', motherName: 'Sefali Khatun', mobile: '01746475487', homeMobile: '01753278470', schoolId: 20, batchId: 3, roll: 27, address: '2no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Afia Ibnat', fatherName: 'Ashraful Alom', motherName: 'Ruksana Begum', mobile: '01724307585', homeMobile: '', schoolId: 20, batchId: 3, roll: 28, address: '2no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Jannatul Fardous', fatherName: 'Atiqul Islam', motherName: 'Suraiya Nur Begum', mobile: '01602342135', homeMobile: '', schoolId: 20, batchId: 3, roll: 29, address: '2no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Jannatul Tasnim Mahiya', fatherName: 'Habibur Rahman', motherName: 'Umme Kulsum', mobile: '01731310388', homeMobile: '', schoolId: 1, batchId: 3, roll: 30, address: '5 no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Meghla Akter Akhi', fatherName: 'Asadujjaman', motherName: 'Nur Jahan', mobile: '01976360955', homeMobile: '', schoolId: 1, batchId: 3, roll: 31, address: '5 no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Jamila Jannat Tora', fatherName: 'Monirujjaman', motherName: 'Sabikun Nahar', mobile: '01632017788', homeMobile: '', schoolId: 18, batchId: 3, roll: 32, address: '9 no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Israt Jahan', fatherName: 'Baccu Mia', motherName: 'Oyadia Afrin', mobile: '01705077391', homeMobile: '', schoolId: 18, batchId: 3, roll: 33, address: '9 no ward, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Mymona Akter Pinki', fatherName: 'Md. Kamal', motherName: 'Mst. Parul', mobile: '01731263363', homeMobile: '', schoolId: 18, batchId: 3, roll: 34, address: 'Boilor, Corpara, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Sharika Jannat', fatherName: 'Md. Sarowar Jamal', motherName: 'Mst. Kadija', mobile: '01716113980', homeMobile: '01744844555', schoolId: 20, batchId: 3, roll: 35, address: '2no Word', gender: 'Female', class: 'Seven' },
    { name: 'Firoza Haque Fahmida', fatherName: 'S.M Kobirujjaman', motherName: 'Farhana Yesmin', mobile: '01718303061', homeMobile: '01760301264', schoolId: 18, batchId: 3, roll: 36, address: 'Girls School Road, Trishal', gender: 'Female', class: 'Seven' },
    { name: 'Muslima Tasnim Adiba Mondol', fatherName: 'Asraful Alom', motherName: 'Lima', mobile: '01719809947', homeMobile: '', schoolId: 20, batchId: 3, roll: 37, address: 'Ujanpara, Trishal', gender: 'Female', class: 'Seven' },

    // Batch 73 (3 students)
    { name: 'Nafim Hasan', fatherName: 'Rafiqul Islam', motherName: 'Nurun Nahar', mobile: '01602514689', homeMobile: '01316108102', schoolId: 23, batchId: 4, roll: 1, address: 'Durduria', gender: 'Male', class: 'Seven' },
    { name: 'Md. Sadman Al Fakid', fatherName: 'Md. Shoriful Islam', motherName: 'Mst. Kohinur', mobile: '01759280537', homeMobile: '', schoolId: 20, batchId: 4, roll: 2, address: '2no ward, Trishal', gender: 'Male', class: 'Seven' },
    { name: 'Abir Khan', fatherName: 'Md. Abdul Lotif Khan', motherName: 'Mst. Ajifa Khatun', mobile: '01789954841', homeMobile: '01724042393', schoolId: 20, batchId: 4, roll: 3, address: 'Nurur Dukan, Boilor', gender: 'Male', class: 'Seven' },

    // ==================== CLASS EIGHT ====================
    // Batch 81 (13 students)
    { name: 'Sabiha Khanom', fatherName: 'Md. Nurul Islam', motherName: 'Kohinur', mobile: '01748650368', homeMobile: '', schoolId: 1, batchId: 5, roll: 1, address: 'Balipara road 9no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Mahjabin Ellin', fatherName: 'Noazjis Hossain Akondo', motherName: 'Marjia Akter', mobile: '01719673408', homeMobile: '01752527906', schoolId: 1, batchId: 5, roll: 2, address: 'Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Mst. Moriyom Akter Towwa', fatherName: 'Abu Raihan', motherName: 'Mst. Samima Khatun', mobile: '01978266936', homeMobile: '', schoolId: 1, batchId: 5, roll: 3, address: '7no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Arifa Islam Hafsa', fatherName: 'Ariful Islam', motherName: 'Papia', mobile: '01752725172', homeMobile: '', schoolId: 1, batchId: 5, roll: 4, address: '9no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Mst. Mohsina', fatherName: 'Md. Abdul Bashar', motherName: 'Mst. Saleha Khatun', mobile: '01635924345', homeMobile: '', schoolId: 1, batchId: 5, roll: 5, address: '4no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Maria Masturat', fatherName: 'Mujammel', motherName: 'Mahmuda', mobile: '01791415369', homeMobile: '', schoolId: 1, batchId: 5, roll: 6, address: 'Lekerper, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Mariam Khandaker Saba', fatherName: 'Shahjahan Khandaker', motherName: 'Hamida Khandaker', mobile: '01746469497', homeMobile: '', schoolId: 1, batchId: 5, roll: 7, address: '4 no word', gender: 'Female', class: 'Eight' },
    { name: 'Jerin Akter Mim', fatherName: 'Mofijul Islam', motherName: 'Sanjida', mobile: '01725402587', homeMobile: '', schoolId: 1, batchId: 5, roll: 8, address: '7no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Noushin Tarannum Tohfa', fatherName: 'Shofiqul Islam', motherName: 'Umme Salma', mobile: '01745818005', homeMobile: '', schoolId: 1, batchId: 5, roll: 9, address: 'Kunabari, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Fatema Tuz Zohura', fatherName: 'Md. Jiyaul Haque', motherName: 'Hasi Akter', mobile: '01935068716', homeMobile: '', schoolId: 1, batchId: 5, roll: 10, address: '4no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Jamatul Nahar Samia', fatherName: 'Sohel Mia', motherName: 'Rojina Akter', mobile: '01718551408', homeMobile: '01725264020', schoolId: 1, batchId: 5, roll: 11, address: '9no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Mst. Fatehatul Tashme Zithi', fatherName: 'Md. Mujammel Haque', motherName: 'Mst. Shahanaz', mobile: '01717609229', homeMobile: '', schoolId: 1, batchId: 5, roll: 12, address: '8no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Sidraul Anika Bushra', fatherName: 'Ajid Uddin', motherName: 'Rubina Begum', mobile: '01780845428', homeMobile: '', schoolId: 1, batchId: 5, roll: 13, address: '7no ward, Trishal', gender: 'Female', class: 'Eight' },

    // Batch 82 (22 students)
    { name: 'Rousonara Islam Asfia', fatherName: 'Md. Romjan Ali', motherName: 'Setu', mobile: '01727407156', homeMobile: '017308331756', schoolId: 3, batchId: 6, roll: 1, address: '9 no ward, Majipara, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Habiba Binte Ahmed', fatherName: 'Boktiar Ahmed', motherName: 'Sharmin Sultana', mobile: '01784262764', homeMobile: '', schoolId: 23, batchId: 6, roll: 2, address: 'Boilor, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Nilima Akter Nipun', fatherName: 'Shopon', motherName: 'Shabiha Sultana', mobile: '01751811772', homeMobile: '', schoolId: 23, batchId: 6, roll: 3, address: '8no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Raita Tarannum Taifa', fatherName: 'Md. Hafizur Rahman Sohag', motherName: 'Mahmuda', mobile: '01761568253', homeMobile: '', schoolId: 18, batchId: 6, roll: 4, address: '2no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Jannatul Mawa Nawar', fatherName: 'Md. Ahsan Habib', motherName: 'Dil Jahan', mobile: '01719707355', homeMobile: '', schoolId: 18, batchId: 6, roll: 5, address: '2no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Umme Taiba', fatherName: 'Md. Atahar Ali', motherName: 'Mst. Hasna Hena', mobile: '01981381779', homeMobile: '', schoolId: 18, batchId: 6, roll: 6, address: '7no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Nusrat Jahan Tanisha', fatherName: 'Md. Harej Uddin', motherName: 'Halima Khatun', mobile: '01618407321', homeMobile: '', schoolId: 23, batchId: 6, roll: 7, address: '9no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Mst. Habiba Akter', fatherName: 'Md. Hafiz Uddin', motherName: 'Mst. Lotifa', mobile: '01791374974', homeMobile: '01717266988', schoolId: 23, batchId: 6, roll: 8, address: '9no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Najefa Dipty', fatherName: 'Shohidul', motherName: 'Sadeka', mobile: '01721529450', homeMobile: '', schoolId: 23, batchId: 6, roll: 9, address: 'Darirampur, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Maliha Afrin Sija', fatherName: 'Asadujjaman', motherName: 'Marjia Khatun', mobile: '01705007562', homeMobile: '', schoolId: 23, batchId: 6, roll: 10, address: '9no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Shahanur Jannat Mithila', fatherName: 'Md. Asdujjaman', motherName: 'Mst. Nur Jahan', mobile: '01976360955', homeMobile: '', schoolId: 18, batchId: 6, roll: 11, address: '5 no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Nodiya Neslin Nidhi', fatherName: 'Abu Nahid Al Mamun', motherName: 'Tanjina Afrin', mobile: '01736992866', homeMobile: '', schoolId: 18, batchId: 6, roll: 12, address: '5 no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Asia Islam Jui', fatherName: 'Azaharul Islam', motherName: 'Wahida Islam', mobile: '01670192453', homeMobile: '', schoolId: 18, batchId: 6, roll: 13, address: '8no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Lamia Khatun Tuhrah', fatherName: 'Md. Budrul Alom', motherName: 'Mst. Nurunnahar', mobile: '01320905558', homeMobile: '', schoolId: 18, batchId: 6, roll: 14, address: '7 no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Roiada Hasan Ridita', fatherName: 'Rajib', motherName: 'Afroja', mobile: '01305432768', homeMobile: '', schoolId: 18, batchId: 6, roll: 15, address: 'Baghan, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Miftahul Jannat Shoily', fatherName: 'Josim', motherName: 'Sultana Saima', mobile: '', homeMobile: '', schoolId: 18, batchId: 6, roll: 16, address: '', gender: 'Female', class: 'Eight' },
    { name: 'Nusrat Siddique Priyota', fatherName: 'Md. Abu Bokkor', motherName: 'Kaleda', mobile: '01608954962', homeMobile: '', schoolId: 18, batchId: 6, roll: 17, address: '9no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Sania Akter Rinthi', fatherName: 'Kairul Islam', motherName: 'Marjia', mobile: '01821195633', homeMobile: '', schoolId: 18, batchId: 6, roll: 18, address: '4no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Tasnuva Tahsin Ekra', fatherName: 'Md. Jamal Uddin', motherName: 'Mst. Badrun', mobile: '0171842249', homeMobile: '', schoolId: 23, batchId: 6, roll: 19, address: 'Hodder Bita', gender: 'Female', class: 'Eight' },
    { name: 'Lubaba Bhuiyan', fatherName: 'Md. Lutfor Rahman', motherName: 'Nilofar', mobile: '01916772007', homeMobile: '', schoolId: 18, batchId: 6, roll: 20, address: '4no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Tori Jahan', fatherName: 'Md. Samim', motherName: 'Ruksana Begum', mobile: '01821892014', homeMobile: '01887731230', schoolId: 18, batchId: 6, roll: 21, address: '2no ward, Trishal', gender: 'Female', class: 'Eight' },
    { name: 'Jannatul Ferdous Enna', fatherName: 'Sabbir', motherName: 'Jakia', mobile: '01731466011', homeMobile: '01841398031', schoolId: 23, batchId: 6, roll: 22, address: 'Kacigonj, Trishal', gender: 'Female', class: 'Eight' },

    // Batch 83 (14 students)
    { name: 'Ershad Jamil', fatherName: 'Md. Saiful Islam', motherName: 'Mst. Roksana Akter', mobile: '01630415530', homeMobile: '', schoolId: 23, batchId: 7, roll: 1, address: 'Darirampur, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Md. Sahariyar Ahammed Sadib', fatherName: 'Md. Selim Mia', motherName: 'Mst. Sewli', mobile: '01719781595', homeMobile: '', schoolId: 1, batchId: 7, roll: 2, address: '9no ward, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Md. Ahad Ahmed Nafiz', fatherName: 'Dulal', motherName: 'Nargis', mobile: '01912418884', homeMobile: '', schoolId: 1, batchId: 7, roll: 3, address: '9no ward, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Inkiad Rahman Ibtisham', fatherName: 'Lotif', motherName: 'Milkly', mobile: '01727781509', homeMobile: '', schoolId: 20, batchId: 7, roll: 4, address: '4 no word', gender: 'Male', class: 'Eight' },
    { name: 'Md. Mahim Hasan', fatherName: 'Faruk Mia', motherName: 'Samsunnahar', mobile: '01906973446', homeMobile: '01330230017', schoolId: 1, batchId: 7, roll: 5, address: 'Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Mahin', fatherName: 'Abu Sayid', motherName: 'Nargis Khatun', mobile: '01979633669', homeMobile: '', schoolId: 1, batchId: 7, roll: 6, address: 'Hodder Bita', gender: 'Male', class: 'Eight' },
    { name: 'Nokib Hasan', fatherName: 'Bujlul Haque', motherName: 'Selina Akter', mobile: '0190711929', homeMobile: '', schoolId: 20, batchId: 7, roll: 7, address: 'Darirampur, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Md. Sourob Hasan Labib', fatherName: 'Md. Anamul Haque', motherName: 'Mst. Megla', mobile: '01985193074', homeMobile: '01922295436', schoolId: 1, batchId: 7, roll: 8, address: '9 no ward, Majipara, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Mojammel Hosen Tamim', fatherName: 'Md. Mojibur Rahman', motherName: 'Selina Khatun', mobile: '01719675695', homeMobile: '01727553791', schoolId: 1, batchId: 7, roll: 9, address: 'Birrampur, Ujanpara', gender: 'Male', class: 'Eight' },
    { name: 'Mahi Uzzaman Tahmid', fatherName: 'Shajahan', motherName: 'Marufa Beghum', mobile: '01321703712', homeMobile: '', schoolId: 20, batchId: 7, roll: 10, address: 'Cikna Monohor', gender: 'Male', class: 'Eight' },
    { name: 'Md. Suyeb ehtesam Sabit', fatherName: 'Md. Monjurul', motherName: 'Mst. Lavly Akter', mobile: '01608080351', homeMobile: '', schoolId: 1, batchId: 7, roll: 11, address: '9no ward, Majipara, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Tushar Ahmed', fatherName: 'Saiful Islam', motherName: 'Tohina', mobile: '01865239847', homeMobile: '01768008916', schoolId: 8, batchId: 7, roll: 12, address: 'Amirabari, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Sadiujjaman Saad', fatherName: 'Sadiujjaman', motherName: 'Kamrun Nahar', mobile: '01764166541', homeMobile: '', schoolId: 1, batchId: 7, roll: 13, address: 'Girls School Road, Trishal', gender: 'Male', class: 'Eight' },
    { name: 'Mosaddik Billah Sazin', fatherName: 'Md. Shajahan Sarkar', motherName: 'Mst. Salma Sultana', mobile: '01784150195', homeMobile: '', schoolId: 1, batchId: 7, roll: 14, address: 'Birrampur Ujanpara, Trishal', gender: 'Male', class: 'Eight' },

    // ==================== CLASS NINE ====================
    // Batch 91 (17 students)
    { name: 'Shabiha Faija', fatherName: 'Fojlul Haque', motherName: 'Parbin Akter', mobile: '01768146757', homeMobile: '', schoolId: 1, batchId: 8, roll: 1, address: 'Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Taieba Nur Riha', fatherName: 'Md. Nazrul Kabir Ripon', motherName: 'Rabia Sultana', mobile: '01738195524', homeMobile: '', schoolId: 1, batchId: 8, roll: 2, address: 'Majipara Road 9no ward, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Israt Jahan Isra', fatherName: 'Mahabub Islam', motherName: 'Shamima Akter', mobile: '01725865913', homeMobile: '01763997020', schoolId: 1, batchId: 8, roll: 3, address: '3no ward, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Nusrat Jahan Promi', fatherName: 'Md. Nurul Islam', motherName: 'Mst. Nurjahan', mobile: '01948262936', homeMobile: '', schoolId: 1, batchId: 8, roll: 4, address: '9no ward, Majipara, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Suborna Akther Tonni', fatherName: 'Md. Abu Taher', motherName: 'Mst. Kolpona Akter', mobile: '01740598681', homeMobile: '', schoolId: 1, batchId: 8, roll: 5, address: '9no ward, Majipara, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Tahomina Akter Jabiya', fatherName: 'Md. Sujon', motherName: 'Mst. Mala', mobile: '01733162778', homeMobile: '', schoolId: 1, batchId: 8, roll: 6, address: 'Birrampur Ujanpara', gender: 'Female', class: 'Nine' },
    { name: 'Sadia Akter', fatherName: 'Abdul Kader', motherName: 'Lima', mobile: '01629939379', homeMobile: '', schoolId: 18, batchId: 8, roll: 7, address: 'Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Lamia Akter Srabony', fatherName: 'Humayun Kabir', motherName: 'Molina Beghum', mobile: '01710396912', homeMobile: '01713683180', schoolId: 20, batchId: 8, roll: 8, address: 'Corpara, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Sania Islam Nova', fatherName: 'Johirul Islam', motherName: 'Safia Ferdous', mobile: '01913838630', homeMobile: '', schoolId: 18, batchId: 8, roll: 9, address: 'Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Mayesha Binte Shafique (Sweekrity)', fatherName: 'Md. Shofiqul Islam', motherName: 'Jahanara Begum', mobile: '01749546311', homeMobile: '', schoolId: 1, batchId: 8, roll: 10, address: 'Ujanpara, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Afifa Fahmida', fatherName: 'Atiqur Rahman', motherName: 'Rasida Begum', mobile: '01725979199', homeMobile: '', schoolId: 20, batchId: 8, roll: 11, address: 'Corpara, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Najiya Tabassum', fatherName: 'Md. Motiur Rahman', motherName: 'Salma Akter', mobile: '01794442179', homeMobile: '', schoolId: 20, batchId: 8, roll: 12, address: 'Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Adiba Mubassira', fatherName: 'Alal Uddin', motherName: 'Shahnaz', mobile: '01822395236', homeMobile: '01406073921', schoolId: 18, batchId: 8, roll: 13, address: '2 no word', gender: 'Female', class: 'Nine' },
    { name: 'Tabassum Toha', fatherName: 'Tajuddin', motherName: 'Momtaj', mobile: '01618069994', homeMobile: '', schoolId: 1, batchId: 8, roll: 14, address: 'Akhrail', gender: 'Female', class: 'Nine' },
    { name: 'Sharia Azmi Hafsa', fatherName: 'Shohel', motherName: 'Rojina Akter', mobile: '01772232201', homeMobile: '', schoolId: 1, batchId: 8, roll: 15, address: '9no ward, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Afia Anjum', fatherName: 'Anuwar Hossain', motherName: 'Juiela Khatun', mobile: '01713566359', homeMobile: '01722002442', schoolId: 1, batchId: 8, roll: 16, address: '2no ward, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Tasfia Akter Suchi', fatherName: 'Shohel Mia', motherName: 'Najma Akter', mobile: '01798335726', homeMobile: '01751320482', schoolId: 20, batchId: 8, roll: 17, address: '2no ward, Trishal', gender: 'Female', class: 'Nine' },

    // Batch 92 (7 students)
    { name: 'Puspita Chanda Peu', fatherName: 'Uttom Kumar', motherName: 'Sucitra Chanda', mobile: '01710152930', homeMobile: '', schoolId: 18, batchId: 9, roll: 1, address: '2no ward, Danikola Mur, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Zannatul Nusrat Nabila', fatherName: 'Jamal Uddin', motherName: 'Fatema Khatun', mobile: '01615545087', homeMobile: '', schoolId: 18, batchId: 9, roll: 2, address: 'Awultia, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Samia Akter', fatherName: 'Anisur Rahman', motherName: 'Mina', mobile: '01743458604', homeMobile: '', schoolId: 11, batchId: 9, roll: 3, address: 'Olhori, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Mehenaj Akter', fatherName: 'Anisur Rahman', motherName: 'Mina', mobile: '01743458604', homeMobile: '', schoolId: 11, batchId: 9, roll: 4, address: 'Olhori, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Iftyat Jahan Prova', fatherName: 'Asahak Ali', motherName: 'Fahima Akter', mobile: '01724150244', homeMobile: '01879054597', schoolId: 18, batchId: 9, roll: 5, address: 'Ujanpara, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Rowson Tabassum Rifa', fatherName: 'Sahadat Hossain', motherName: 'Hosneara', mobile: '01609747592', homeMobile: '', schoolId: 18, batchId: 9, roll: 6, address: '9no ward, Trishal', gender: 'Female', class: 'Nine' },
    { name: 'Mst. Haniam Maria', fatherName: 'Md. Muffajjol', motherName: 'Mst. Taslima', mobile: '01319462862', homeMobile: '', schoolId: 18, batchId: 9, roll: 7, address: 'Nowdar, Trishal', gender: 'Female', class: 'Nine' },

    // Batch 93 (30 students)
    { name: 'Md. Estiak Hosen Roni', fatherName: 'Md. Mokbul Hossain', motherName: 'Mst. Halima Khatun', mobile: '01725808443', homeMobile: '', schoolId: 5, batchId: 10, roll: 1, address: 'Hapania, Danikola', gender: 'Male', class: 'Nine' },
    { name: 'Md. Tanjim Hasan Akib', fatherName: 'Md. Kamrul Hasan', motherName: 'Ajijun Nahar', mobile: '01722644848', homeMobile: '', schoolId: 20, batchId: 10, roll: 2, address: 'Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Rubayet Mohtasim Isfaque', fatherName: 'Md. Emdadul Haque', motherName: 'Mst. Runa Laila', mobile: '01918724573', homeMobile: '', schoolId: 1, batchId: 10, roll: 3, address: 'Nowpara, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Md. Tamzid Hasan Nur', fatherName: 'Md. Najim Uddin', motherName: 'Rabia Khatun', mobile: '01766600973', homeMobile: '01609303808', schoolId: 1, batchId: 10, roll: 4, address: '8no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Md. Mubashir Muhib', fatherName: 'Md. Foijur Rahman', motherName: 'Mst. Marufa Akter', mobile: '01727311946', homeMobile: '', schoolId: 1, batchId: 10, roll: 5, address: '7no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Md. Limon Ahmed Rimon', fatherName: 'Md. Humayun Kabir', motherName: 'Mst. Ripa Akter', mobile: '01731018568', homeMobile: '', schoolId: 1, batchId: 10, roll: 6, address: '7no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Tonmoy', fatherName: 'Md. Abdul Ahad', motherName: 'Mst. Takiya', mobile: '01755644950', homeMobile: '', schoolId: 1, batchId: 10, roll: 7, address: 'Balipara, Road', gender: 'Male', class: 'Nine' },
    { name: 'Yeasin Ahmed Nafi', fatherName: 'Kamrul Hasan', motherName: 'Nadira', mobile: '01770388001', homeMobile: '01764415506', schoolId: 1, batchId: 10, roll: 8, address: 'Milon Bazar, Boilor, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Hasnaeem Khan Saom', fatherName: 'Shorif Hossain', motherName: 'Rani', mobile: '01608075997', homeMobile: '', schoolId: 23, batchId: 10, roll: 9, address: '9no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Mohaiminul Haque', fatherName: 'Umor Faruk', motherName: 'Nasrin', mobile: '01778598392', homeMobile: '01572254864', schoolId: 20, batchId: 10, roll: 10, address: '2no Word', gender: 'Male', class: 'Nine' },
    { name: 'Sha Poran', fatherName: 'Sha Alam', motherName: 'Ayasha', mobile: '01739921614', homeMobile: '01734109465', schoolId: 1, batchId: 10, roll: 11, address: '8 no word', gender: 'Male', class: 'Nine' },
    { name: 'Md. Al Foysal', fatherName: 'Md. Alamgir Kabir', motherName: 'Mst. Musuda Akter', mobile: '01768534360', homeMobile: '', schoolId: 1, batchId: 10, roll: 12, address: '6 no ward, Nowdar, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Abid Hasan Tamnam', fatherName: 'Omar Faruq', motherName: 'Asma Khatun', mobile: '01730790452', homeMobile: '01758858478', schoolId: 1, batchId: 10, roll: 13, address: '8 no word', gender: 'Male', class: 'Nine' },
    { name: 'Saad Hossain Naom', fatherName: 'Shahadat Hossain', motherName: 'Nasrin Beghum', mobile: '01723550178', homeMobile: '', schoolId: 1, batchId: 10, roll: 14, address: 'Corpara, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Takiul Haque', fatherName: 'Emdadul Haque', motherName: 'Taslima', mobile: '01728221246', homeMobile: '', schoolId: 1, batchId: 10, roll: 15, address: '8no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Farhan Sadik', fatherName: 'Amirul Islam', motherName: 'Sabina', mobile: '01741828078', homeMobile: '', schoolId: 1, batchId: 10, roll: 16, address: '2no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Shahriar Nafiz Rizbi', fatherName: 'Emdadul Haque', motherName: 'Forida', mobile: '01925573857', homeMobile: '', schoolId: 1, batchId: 10, roll: 17, address: '9no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Shahariar Haque Sad', fatherName: 'Emdadul Haque', motherName: 'Saniya Akter', mobile: '01717338310', homeMobile: '01635261413', schoolId: 20, batchId: 10, roll: 18, address: '2no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Hasan Mahmud Tamim', fatherName: 'Md. Kolil', motherName: 'Mst. Nurunnahar', mobile: '01734938853', homeMobile: '', schoolId: 1, batchId: 10, roll: 19, address: '2no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Hossain Ahmed Tanin', fatherName: 'Md. Kolil', motherName: 'Nurun Nahar', mobile: '01734938853', homeMobile: '', schoolId: 1, batchId: 10, roll: 20, address: '2no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Abdullah Al Numan', fatherName: 'Mustak', motherName: 'Morjina', mobile: '01764704904', homeMobile: '', schoolId: 1, batchId: 10, roll: 21, address: 'Ragamara, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Ali Hasan Adip', fatherName: 'Helal Uddin', motherName: 'Sika', mobile: '01736487423', homeMobile: '', schoolId: 1, batchId: 10, roll: 22, address: '9no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Abdullah Abid', fatherName: 'Mahabul', motherName: 'Farjana', mobile: '01712779806', homeMobile: '', schoolId: 1, batchId: 10, roll: 23, address: '2no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Abu Ubyda', fatherName: 'Ariful', motherName: 'Shirin', mobile: '01326497837', homeMobile: '', schoolId: 1, batchId: 10, roll: 24, address: '9no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Junaid Ahmed', fatherName: 'Atiqul Islam', motherName: 'Elara Khatun', mobile: '01758144108', homeMobile: '', schoolId: 1, batchId: 10, roll: 25, address: '9no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Zisan Ahmed', fatherName: 'Mussharoff', motherName: 'Chad Sultana', mobile: '01721822323', homeMobile: '', schoolId: 1, batchId: 10, roll: 26, address: '9no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Rajjo Sutra Dar', fatherName: 'Shopon Sutrador', motherName: 'Taposi', mobile: '01782686477', homeMobile: '', schoolId: 23, batchId: 10, roll: 27, address: '7no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Shorif Uddin', fatherName: 'Suja Uddin', motherName: 'Sarfun', mobile: '01782647689', homeMobile: '', schoolId: 1, batchId: 10, roll: 28, address: '9no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Shajedul Islam Midul', fatherName: 'Saiful Islam', motherName: 'Suraiya Akter', mobile: '01733995391', homeMobile: '01833671920', schoolId: 20, batchId: 10, roll: 29, address: '2no ward, Trishal', gender: 'Male', class: 'Nine' },
    { name: 'Rahimul Hasan Murad', fatherName: 'Asraful Islam', motherName: 'Suraiya Akter', mobile: '01730110200', homeMobile: '01614415302', schoolId: 20, batchId: 10, roll: 30, address: 'Danikula, Dokkin Batipara', gender: 'Male', class: 'Nine' },

    // ==================== CLASS TEN ====================
    // Batch 101 (37 students)
    { name: 'Jakiya Alom Oishi', fatherName: 'Jayedull Alom', motherName: 'Nunnahar Rani', mobile: '01714714605', homeMobile: '01723488740', schoolId: 1, batchId: 11, roll: 1, address: 'Balipara road', gender: 'Female', class: 'Ten' },
    { name: 'Maksudun Nahar Mritteka', fatherName: 'Mohiuddin', motherName: 'Nasrin Kondokar', mobile: '01717538766', homeMobile: '', schoolId: 1, batchId: 11, roll: 2, address: '9no ward, Majipara, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Tasnim Tabassum Oarisha', fatherName: 'Md. Al Amin', motherName: 'Umme Salma', mobile: '01733253944', homeMobile: '', schoolId: 1, batchId: 11, roll: 3, address: '9no ward, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mst. Sunjida Islam Jiniya', fatherName: 'Md. Saidur Rahman', motherName: 'Mst. Shirin Akter Shimo', mobile: '01775013622', homeMobile: '01822074155', schoolId: 18, batchId: 11, roll: 4, address: '2no ward, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Tasmia Tabassum Ponum', fatherName: 'Oji Ullah', motherName: 'Maksuda Khatun', mobile: '01926210882', homeMobile: '', schoolId: 18, batchId: 11, roll: 5, address: '7no ward, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mst. Afiya Bilkes', fatherName: 'Md. Mofijul Islam', motherName: 'Mst. Hajbin Nahar', mobile: '01632055963', homeMobile: '01844941669', schoolId: 18, batchId: 11, roll: 6, address: 'Nowdar banti, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mst. Israt Jahan', fatherName: 'Md. Mofijul Islam', motherName: 'Mst. Hajbin Nahar', mobile: '01632055963', homeMobile: '', schoolId: 18, batchId: 11, roll: 7, address: 'Nowdar banti, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Jannatul Ferdous Risha Moni', fatherName: 'Md. Abdur Raupe', motherName: 'Mst. Selina Akter', mobile: '01576734552', homeMobile: '', schoolId: 18, batchId: 11, roll: 8, address: 'Bahadurpur, Cokrampur, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Tanjila Maisha', fatherName: 'Tomjid Ahmad', motherName: 'Jesmin Akter', mobile: '01725981455', homeMobile: '01965423548', schoolId: 3, batchId: 11, roll: 9, address: 'Tarail, Kishorganj', gender: 'Female', class: 'Ten' },
    { name: 'Sumiya Islam', fatherName: 'Abdul hai', motherName: 'Arifa', mobile: '01720365597', homeMobile: '01971437461', schoolId: 16, batchId: 11, roll: 10, address: 'Birrampur Ujanpara', gender: 'Female', class: 'Ten' },
    { name: 'Sadia Haque Diya', fatherName: 'Shohidul Hoque', motherName: 'Aziza', mobile: '01753371010', homeMobile: '', schoolId: 1, batchId: 11, roll: 11, address: 'Nowder laker par', gender: 'Female', class: 'Ten' },
    { name: 'Fahmida Afrin Sinthya', fatherName: 'Fokhaer Uddin', motherName: 'Sabina', mobile: '01751811772', homeMobile: '', schoolId: 23, batchId: 11, roll: 12, address: 'Dorirampur 8 no word', gender: 'Female', class: 'Ten' },
    { name: 'Chahad Saruar Mithila', fatherName: 'Sarwar Jahan Sorker', motherName: 'Rita', mobile: '01925475655', homeMobile: '', schoolId: 23, batchId: 11, roll: 13, address: 'Dorirampur 9 no word', gender: 'Female', class: 'Ten' },
    { name: 'Orpita Islam Purnota', fatherName: 'Badol', motherName: 'Ela', mobile: '01401255152', homeMobile: '', schoolId: 23, batchId: 11, roll: 14, address: 'Dorirampur', gender: 'Female', class: 'Ten' },
    { name: 'Mahia Zinnat Tithi', fatherName: 'Mazharul Islam', motherName: 'Champa', mobile: '01954115205', homeMobile: '', schoolId: 7, batchId: 11, roll: 15, address: 'Baliyarpar', gender: 'Female', class: 'Ten' },
    { name: 'Niger Tarannum Nowshin', fatherName: 'Abdullah Al Mamun', motherName: 'Mst. Shorifa Akter', mobile: '01716359087', homeMobile: '', schoolId: 18, batchId: 11, roll: 16, address: 'Kunabari, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Tasnim Hossain Mehazabein', fatherName: 'Abul Hossain', motherName: 'Mojida Begum', mobile: '01795855906', homeMobile: '01712169595', schoolId: 1, batchId: 11, roll: 17, address: 'Majipara Road 9no ward, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Sharah Nusrat Punno', fatherName: 'Abul Kalam', motherName: 'Jesmin', mobile: '01719183330', homeMobile: '01915021221', schoolId: 18, batchId: 11, roll: 18, address: 'Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Rownak Jahan Farin', fatherName: 'Md. Omor Faruk', motherName: 'Sabina', mobile: '01703050254', homeMobile: '01789304330', schoolId: 18, batchId: 11, roll: 19, address: 'Kunabari, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Rayda Ibrahim', fatherName: 'Ibrahim Kolil', motherName: 'Forida', mobile: '01768939478', homeMobile: '01941779670', schoolId: 1, batchId: 11, roll: 20, address: 'Kathal Baliarpar, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mst. Sumona Akter', fatherName: 'Md. Shohel Mia', motherName: 'Minara Khatun', mobile: '01777486277', homeMobile: '01338970531', schoolId: 1, batchId: 11, roll: 21, address: 'Baliarpar, Hodderbita, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Farina Jahan', fatherName: 'Sarowar Jahan Khan', motherName: 'Farhana Nargish', mobile: '01919377344', homeMobile: '', schoolId: 1, batchId: 11, roll: 22, address: '4no ward, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mst. Khadija Akter Saniya', fatherName: 'Mohammad Sakowat', motherName: 'Mst. Taslima Khatun', mobile: '01735355800', homeMobile: '', schoolId: 24, batchId: 11, roll: 23, address: 'Raimoni, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Sumaiya Nazrin', fatherName: 'Asadul Haque', motherName: 'Helena Khatun', mobile: '01735661850', homeMobile: '', schoolId: 1, batchId: 11, roll: 24, address: 'Lekerper, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mumarrad Amin', fatherName: 'Yeahia Amin', motherName: 'Rebeka Sharmin', mobile: '01743718706', homeMobile: '', schoolId: 1, batchId: 11, roll: 25, address: 'Lekerper, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mahfuza Rahman Parisa', fatherName: 'Mustafizur Rahman', motherName: 'Mst. Abida Zahan Sathi', mobile: '01737939324', homeMobile: '', schoolId: 1, batchId: 11, roll: 26, address: 'Gofakori Bazar, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Tayba Akter Ritu', fatherName: 'Kamrul Islam', motherName: 'Samim Nasrin', mobile: '01797174959', homeMobile: '01734428591', schoolId: 18, batchId: 11, roll: 27, address: 'Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Mst. Kamrun Tabassum', fatherName: 'Md. Kafil Uddin', motherName: 'Mst. Rubea Khatun', mobile: '01753371274', homeMobile: '', schoolId: 11, batchId: 11, roll: 28, address: 'Motbari, Raniganj, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Fatema Tuz Johora Jati', fatherName: 'Md. Josim Uddin', motherName: 'Mst. Taslima Khatun', mobile: '01727635187', homeMobile: '', schoolId: 18, batchId: 11, roll: 29, address: 'Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Habiba Akter', fatherName: 'Hasan', motherName: 'Monira', mobile: '01770572615', homeMobile: '', schoolId: 18, batchId: 11, roll: 30, address: '2no Word', gender: 'Female', class: 'Ten' },
    { name: 'Farzana Yesmin Anika', fatherName: 'Anowar', motherName: 'Moony', mobile: '01777513327', homeMobile: '', schoolId: 23, batchId: 11, roll: 31, address: 'Kablapara', gender: 'Female', class: 'Ten' },
    { name: 'Maksuda Jannat', fatherName: 'Moin', motherName: 'Afrin', mobile: '01311212011', homeMobile: '01727454386', schoolId: 18, batchId: 11, roll: 32, address: '4 no word', gender: 'Female', class: 'Ten' },
    { name: 'Fahmida Faruk', fatherName: 'Md. Gulam Faruk', motherName: 'Hijbun Nahar', mobile: '01798974573', homeMobile: '', schoolId: 18, batchId: 11, roll: 33, address: '2no ward, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Maysha Morioum Nishat', fatherName: 'Md. Abdul Momen', motherName: 'Nahid Sultana', mobile: '01749987398', homeMobile: '01317416860', schoolId: 1, batchId: 11, roll: 34, address: '8no ward, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Nur Morium', fatherName: 'Md. Rafiqul Islam', motherName: 'Sahinur Begum', mobile: '01345727685', homeMobile: '', schoolId: 7, batchId: 11, roll: 35, address: 'Baliarpar, Kathal, Trishal', gender: 'Female', class: 'Ten' },
    { name: 'Madia Akter', fatherName: 'Mouklsull', motherName: 'Nasima', mobile: '01778308683', homeMobile: '', schoolId: 7, batchId: 11, roll: 36, address: 'Baliyarpar', gender: 'Female', class: 'Ten' },
    { name: 'Afifa Amina', fatherName: 'A.K.M Anisur Rahman', motherName: 'Umme Lamisa', mobile: '01552450006', homeMobile: '01300142747', schoolId: 18, batchId: 11, roll: 37, address: 'Kunabari, Trishal', gender: 'Female', class: 'Ten' },

    // Batch 103 (15 students)
    { name: 'Sajid Al Jabir', fatherName: 'Md. Kobirujjaman', motherName: 'Rahima Khatun', mobile: '01722424150', homeMobile: '01315957639', schoolId: 23, batchId: 12, roll: 1, address: 'Balipara road 9no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Yasir Ahmed', fatherName: 'Gulap Hossain', motherName: 'Morjina Khatun', mobile: '01400634611', homeMobile: '01345707045', schoolId: 20, batchId: 12, roll: 2, address: 'Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Mushfiqur Rahaman Prince', fatherName: 'Jahangir', motherName: 'Papia', mobile: '01732346552', homeMobile: '01877331371', schoolId: 1, batchId: 12, roll: 3, address: '2no ward, Islami Academy road', gender: 'Male', class: 'Ten' },
    { name: 'Jubayer Ahmad', fatherName: 'Md. Atiqur Rahman', motherName: 'Jannatul Ferdous', mobile: '01794647289', homeMobile: '01333831336', schoolId: 20, batchId: 12, roll: 4, address: '2no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Abdullah Al Jonaeid', fatherName: 'Joynal Abedin', motherName: 'Forida', mobile: '01732614281', homeMobile: '01735139735', schoolId: 20, batchId: 12, roll: 5, address: 'Majipara Road, 9no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Mahmudul Hasan', fatherName: 'Mahabub Alom', motherName: 'Salma Akter', mobile: '01701427979', homeMobile: '01959369822', schoolId: 1, batchId: 12, roll: 6, address: '4no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'MOSHIN HASAN AKANDA TUHIN', fatherName: 'ABDUL KADER', motherName: 'MINARA BEGUM', mobile: '01987346986', homeMobile: '01914660131', schoolId: 1, batchId: 12, roll: 7, address: '8no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'RAYAD IBRAHIM', fatherName: 'IBRAHIM KOLIL', motherName: 'Forida', mobile: '01768939478', homeMobile: '01941779670', schoolId: 1, batchId: 12, roll: 8, address: 'Kathal Baliarpar, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Md. Rabbir Hasan', fatherName: 'Md. Delowar Hossain', motherName: 'Soniya Akter', mobile: '01711991421', homeMobile: '01714077388', schoolId: 20, batchId: 12, roll: 9, address: '8no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Yeasin Arafat Alif', fatherName: 'Md. Monirujjaman', motherName: 'Mst. Monjila Akter', mobile: '01986130745', homeMobile: '01743234888', schoolId: 20, batchId: 12, roll: 10, address: 'Ujanpara, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Abu Horf Khan', fatherName: 'Md. Mofiz Uddin', motherName: 'Halima Parvin', mobile: '01603780391', homeMobile: '01745795721', schoolId: 1, batchId: 12, roll: 11, address: '8no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Azmain Mahtab', fatherName: 'Ripon', motherName: 'Arifa Akter', mobile: '01324477472', homeMobile: '', schoolId: 1, batchId: 12, roll: 12, address: '3no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Rafiuzzaman Rafin', fatherName: 'Nurul Amin', motherName: 'Ribina Akter', mobile: '01631942138', homeMobile: '', schoolId: 1, batchId: 12, roll: 13, address: 'Porabari Road, Coroitola Madrasa, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Salman Ahsan Alif', fatherName: 'Md. Ashak Ali', motherName: 'Mst. Samsun Nahar', mobile: '01614536892', homeMobile: '01643907941', schoolId: 20, batchId: 12, roll: 14, address: '2no ward, Trishal', gender: 'Male', class: 'Ten' },
    { name: 'Md. Mahidul Islam', fatherName: 'Shahid ullah', motherName: 'Asheka', mobile: '01718089868', homeMobile: '', schoolId: 1, batchId: 12, roll: 15, address: 'Cikna Monohor, Trishal', gender: 'Male', class: 'Ten' },
  ];

  // Create students first
  await prisma.student.createMany({
    data: students,
    skipDuplicates: true,
  });

  console.log(`${students.length} students created successfully!`);

  // Create users for each student and link them
  const DEFAULT_PASSWORD = "Sl@bcc2015";
  const studentPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const student of students) {
    if (student.mobile) {
      const username = student.mobile;
      
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (!existingUser) {
        const user = await prisma.user.create({
          data: {
            username,
            password: studentPassword,
            name: student.name,
            role: Role.STUDENT,
          },
        });

        // Find student by batch and roll to update userId
        const existingStudent = await prisma.student.findFirst({
          where: { 
            batchId: student.batchId,
            roll: student.roll,
          },
        });

        if (existingStudent) {
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: { userId: user.id } as any,
          });
        }
      }
    }
  }

  console.log("Student users created successfully!");

  // Create Teachers with user accounts
  const teachers = [
    { name: "Md. Abdul Malek", mobile: "01711111111", gender: "Male", email: "malek@coaching.com" },
    { name: "Mst. Fatima Begum", mobile: "01722222222", gender: "Female", email: "fatima@coaching.com" },
    { name: "Md. Zahirul Islam", mobile: "01733333333", gender: "Male", email: "zahir@coaching.com" },
    { name: "Mst. Anjuman Ara", mobile: "01744444444", gender: "Female", email: "anjuman@coaching.com" },
    { name: "Md. Sarwar Jahan", mobile: "01755555555", gender: "Male", email: "sarwar@coaching.com" },
  ];

  for (const teacher of teachers) {
    const username = teacher.mobile;
    
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name: teacher.name,
          role: Role.TEACHER,
        },
      });

      await prisma.teacher.create({
        data: {
          name: teacher.name,
          mobile: teacher.mobile,
          gender: teacher.gender,
          email: teacher.email,
          userId: user.id,
        },
      });
    }
  }

  console.log("Teacher users created successfully!");
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });