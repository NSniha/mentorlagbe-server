import 'dotenv/config';
import {randomBytes} from 'node:crypto';
import {connectData,DEMO_MODE,findOne,insert,update,sampleTuitionVisuals} from '../src/data.js';
import {getAuth,initAuth} from '../src/auth.js';

if (DEMO_MODE) {
 console.log('Demo data is created automatically the first time you start the server.');
 process.exit(0);
}
if (process.env.ALLOW_SAMPLE_DATA !== 'true') {
 throw new Error('Set ALLOW_SAMPLE_DATA=true to seed sample listings.');
}

const description = 'Dedicated subject mentorship with a weekly learning plan, practical exercises, individual feedback, and regular progress checks.';
const entries=[['HSC Mathematics Revision','Mathematics'],['IELTS Speaking Practice','IELTS'],['Physics Exam Preparation','Physics'],['Beginner Python Programming','Programming'],['SSC English Masterclass','English'],['Organic Chemistry Fundamentals','Chemistry'],['Biology & Human Anatomy','Biology'],['Class 8 Mathematics','Mathematics'],['React Frontend Bootcamp','Programming'],['English Speaking Confidence','English'],['Accounting Principles','Accounting'],['University Math Admission','Mathematics']];

const sampleTutors = new Map();
async function findOrCreateSampleTutor(sampleTutorId, tutorProfile) {
 if (sampleTutors.has(sampleTutorId)) return sampleTutors.get(sampleTutorId);

 const email = 'mentorlagbe-sample-' + sampleTutorId + '@example.test';
 let tutor = await findOne('users', {email});
 if (!tutor) {
  if (!getAuth()) initAuth();
  await getAuth().api.signUpEmail({body: {
   ...tutorProfile,
   email,
   password: randomBytes(24).toString('hex'),
   role: 'tutor',
  }});
  tutor = await findOne('users', {email});
 }
 if (tutor?.role !== 'tutor') {
  throw new Error('The sample account for ' + tutorProfile.name + ' must have the tutor role.');
 }
 sampleTutors.set(sampleTutorId, tutor);
 return tutor;
}

await connectData();
let restored = 0;
let added = 0;
let linkedApplications = 0;

for (const [index, [title, subject]] of entries.entries()) {
 const existing = await findOne('tuitions', {title});
 if (existing && (existing.description !== description || existing.subject !== subject)) continue;
 const {bannerImage,sampleTutorId,tutorProfile} = sampleTuitionVisuals[index];
 const originalSample = {title,subject,description};

 if (existing && await findOne('applications', {tuitionId:existing.id})) {
  await update('tuitions', {id:existing.id,...originalSample}, {bannerImage});
  linkedApplications++;
  continue;
 }

 const tutor = await findOrCreateSampleTutor(sampleTutorId, tutorProfile);
 const card = {bannerImage,tutorId:tutor.id,tutorName:tutor.name,tutorEmail:tutor.email};
 if (existing) {
  await update('tuitions', {id:existing.id,...originalSample}, card);
  restored++;
  continue;
 }

 await insert('tuitions', {
  ...originalSample,
  ...card,
  classLevel: ['Class 9–10','HSC / Class 11–12','University / Adult'][index % 3],
  mode: index % 4 === 0 ? 'Offline' : 'Online',
  location: 'Dhaka, Bangladesh',
  monthlyFee: 2500 + index * 350,
  daysPerWeek: 3,
  approvalStatus: 'approved',
  isActive: true,
  createdAt: new Date(Date.now() - index * 3600000).toISOString(),
 });
 added++;
}

console.log('Sample tuition listings seeded. Restored: ' + restored + ', added: ' + added + '.');
if (linkedApplications) {
 console.log('Banner restored on ' + linkedApplications + ' listing(s) with linked applications.');
}
process.exit(0);
