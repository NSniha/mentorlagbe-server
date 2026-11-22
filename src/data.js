import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export const DEMO_MODE = !process.env.MONGODB_URI;
export const DB_NAME = process.env.DB_NAME || 'mentorlagbe';
let mongo, db, demo;
const dataFile = path.resolve(process.cwd(), '.data/demo.json');

const PHOTO = {
  class: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80',
  math: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&q=80',
  computer: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80',
  books: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=900&q=80',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=900&q=80',
  writing: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&q=80',
  study: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=900&q=80',
  group: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900&q=80',
  laptop: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=900&q=80',
  lecture: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&q=80',
  speaking: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&q=80',
  kid: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&q=80'
};
const avatar = (n) => `https://i.pravatar.cc/160?img=${n}`;
const topics = [
 ['Advanced Mathematics for HSC', 'Mathematics','HSC / Class 11–12','Online','Dhaka',3500,3,'math','tutor-1'],
 ['IELTS Speaking & Writing Masterclass','IELTS','University / Adult','Online','Bangladesh',5000,4,'speaking','tutor-2'],
 ['Physics Made Simple — HSC 2027','Physics','HSC / Class 11–12','Offline','Dhanmondi, Dhaka',4200,3,'science','tutor-1'],
 ['Python Programming for Beginners','Programming','Class 9–12','Online','Bangladesh',3800,2,'computer','tutor-2'],
 ['SSC English Grammar & Composition','English','SSC / Class 9–10','Online','Bangladesh',2800,3,'books','tutor-1'],
 ['Chemistry Crash Course for HSC','Chemistry','HSC / Class 11–12','Offline','Uttara, Dhaka',4500,3,'lecture','tutor-2'],
 ['Biology: Concepts to Confidence','Biology','HSC / Class 11–12','Online','Bangladesh',3200,2,'study','tutor-1'],
 ['Class 8 Math & Science Support','Mathematics','Class 6–8','Offline','Mirpur, Dhaka',2500,3,'kid','tutor-2'],
 ['Web Development with React','Programming','University / Adult','Online','Bangladesh',6500,3,'laptop','tutor-2'],
 ['Spoken English for Everyday Life','English','University / Adult','Online','Bangladesh',3000,2,'group','tutor-1'],
 ['Accounting & Finance Foundations','Accounting','HSC / Class 11–12','Offline','Bashundhara, Dhaka',3600,3,'writing','tutor-2'],
 ['University Admission Math Prep','Mathematics','University / Adult','Online','Bangladesh',5500,4,'class','tutor-1'],
];
const sampleTutorProfiles = {
 'tutor-1': {name: 'Farhan Ahmed', image: avatar(12)},
 'tutor-2': {name: 'Nusrat Jahan', image: avatar(44)},
};
export const sampleTuitionVisuals = topics.map(topic => ({
 bannerImage: PHOTO[topic[7]],
 sampleTutorId: topic[8],
 tutorProfile: sampleTutorProfiles[topic[8]],
}));

function initialDemo() {
 const hashed = bcrypt.hashSync('Demo12345!', 10);
 const users = [
  {id:'admin-demo',name:'Ayesha Rahman',email:'admin@mentorlagbe.demo',passwordHash:hashed,role:'admin',plan:'pro',image:avatar(47),phone:'01700000000',bio:'Platform administrator',createdAt:new Date().toISOString()},
  {id:'tutor-1',...sampleTutorProfiles['tutor-1'],email:'farhan@mentorlagbe.demo',passwordHash:hashed,role:'tutor',plan:'pro',phone:'01700000001',bio:'Math and science mentor with a passion for making difficult concepts easy.',createdAt:new Date().toISOString()},
  {id:'tutor-2',...sampleTutorProfiles['tutor-2'],email:'nusrat@mentorlagbe.demo',passwordHash:hashed,role:'tutor',plan:'pro',phone:'01700000002',bio:'English language and programming coach.',createdAt:new Date().toISOString()},
  {id:'student-demo',name:'Samiha Islam',email:'student@mentorlagbe.demo',passwordHash:hashed,role:'student',plan:'free',image:avatar(45),phone:'01700000003',bio:'Lifelong learner',createdAt:new Date().toISOString(),savedTuitions:[]}
 ];
 const tuitions = topics.map((t,i)=>({id:`tuition-${i+1}`,title:t[0],subject:t[1],classLevel:t[2],mode:t[3],location:t[4],monthlyFee:t[5],daysPerWeek:t[6],bannerImage:PHOTO[t[7]],description:`Personalized ${t[1].toLowerCase()} sessions designed to build confidence through clear explanations, guided practice, and regular progress reviews. Each session includes custom study materials and practical feedback.`,tutorId:t[8],tutorName:users.find(x=>x.id===t[8]).name,tutorEmail:users.find(x=>x.id===t[8]).email,approvalStatus:'approved',isActive:true,createdAt:new Date(Date.now()-i*86400000).toISOString()}));
 return {users,tuitions,applications:[{id:'app-demo-1',tuitionId:'tuition-1',tuitionTitle:tuitions[0].title,subject:tuitions[0].subject,monthlyFee:tuitions[0].monthlyFee,tutorName:tuitions[0].tutorName,tutorEmail:tuitions[0].tutorEmail,studentName:'Samiha Islam',studentEmail:'student@mentorlagbe.demo',studentPhone:'01700000003',preferredSchedule:'Sunday and Tuesday evenings',studentNote:'I want help preparing for my exams.',status:'pending',appliedAt:new Date().toISOString()}],payments:[]};
}
export async function connectData() {
 if (DEMO_MODE) { fs.mkdirSync(path.dirname(dataFile),{recursive:true}); try {demo=JSON.parse(fs.readFileSync(dataFile,'utf8'));} catch {demo=initialDemo();persist();} console.log('✓ Demo database active (local persisted JSON). Payments are disabled.'); return; }
 mongo = new MongoClient(process.env.MONGODB_URI); await mongo.connect(); db = mongo.db(DB_NAME);
 await Promise.all([
  db.collection('tuitions').createIndex({approvalStatus:1,isActive:1,createdAt:-1}),
  db.collection('tuitions').createIndex({tutorEmail:1}),
  db.collection('applications').createIndex({tuitionId:1,studentEmail:1},{unique:true}),
  db.collection('payments').createIndex({stripeSessionId:1},{unique:true,sparse:true}),
  db.collection('payments').createIndex({transactionId:1},{unique:true,sparse:true})
 ]);
 console.log('✓ MongoDB connected');
}
export function database(){return db;}
export function persist(){if(DEMO_MODE && demo) fs.writeFileSync(dataFile,JSON.stringify(demo,null,2));}
export function newId(){return randomUUID();}
export async function all(col){if(DEMO_MODE) return [...(demo[col]||[])]; return db.collection(col).find({}).toArray().then(rows=>rows.map(normalize));}
function mongoWhere(col,where){if(col==='users'&&typeof where.id==='string'){const value=where.id;const {_unused,...rest}=where;delete rest.id;return {$and:[rest,{$or:[{id:value},...(ObjectId.isValid(value)?[{_id:new ObjectId(value)}]:[])]}]};}return where;}
function normalize(row){if(!row) return null;const {_id,...item}=row;return {...item,id:item.id || _id?.toString()};}
export async function findOne(col,where){if(DEMO_MODE)return (demo[col]||[]).find(x=>Object.entries(where).every(([k,v])=>x[k]===v))||null; return normalize(await db.collection(col).findOne(mongoWhere(col,where)));}
export async function insert(col,entry){const item={id:newId(),...entry};if(DEMO_MODE){demo[col].push(item);persist();}else await db.collection(col).insertOne(item);return item;}
export async function update(col,where,values){if(DEMO_MODE){const item=await findOne(col,where);if(!item)return null;Object.assign(item,values);persist();return item;}const result=await db.collection(col).findOneAndUpdate(mongoWhere(col,where),{$set:values},{returnDocument:'after'});return normalize(result);}
export async function remove(col,where){if(DEMO_MODE){const idx=demo[col].findIndex(x=>Object.entries(where).every(([k,v])=>x[k]===v));if(idx<0)return false;demo[col].splice(idx,1);persist();return true;}const res=await db.collection(col).deleteOne(mongoWhere(col,where));return res.deletedCount>0;}
function queryText(value) {
 return typeof value === 'string' ? value.trim() : '';
}
function positiveInteger(value, fallback) {
 if (typeof value !== 'string' && typeof value !== 'number') return fallback;
 const number = Number(value);
 return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}
export async function publicTuitions(query) {
 const search = queryText(query.search).slice(0, 120);
 const subject = queryText(query.subject);
 const classLevel = queryText(query.classLevel);
 const mode = queryText(query.mode);
 const requestedPage = positiveInteger(query.page, 1);
 const pageSize = Math.min(24, positiveInteger(query.limit, 9));

 const where = {approvalStatus: 'approved', isActive: true};
 if (subject && subject !== 'All subjects') where.subject = subject;
 if (classLevel && classLevel !== 'All levels') where.classLevel = classLevel;
 if (mode && mode !== 'All modes') where.mode = mode;

 if (DEMO_MODE) {
  let rows = demo.tuitions.filter(row =>
   Object.entries(where).every(([key, value]) => row[key] === value)
  );
  if (search) {
   const needle = search.toLowerCase();
   rows = rows.filter(row => [row.title, row.subject].some(value => value.toLowerCase().includes(needle)));
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pages);
  return {items: rows.slice((page - 1) * pageSize, page * pageSize), total, page, pages};
 }

 if (search) {
  const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  where.$or = [{title: {$regex: escaped, $options: 'i'}}, {subject: {$regex: escaped, $options: 'i'}}];
 }
 const collection = db.collection('tuitions');
 const total = await collection.countDocuments(where);
 const pages = Math.max(1, Math.ceil(total / pageSize));
 const page = Math.min(requestedPage, pages);
 const items = await collection.find(where).sort({createdAt: -1}).skip((page - 1) * pageSize).limit(pageSize).toArray();
 return {items: items.map(normalize), total, page, pages};
}
