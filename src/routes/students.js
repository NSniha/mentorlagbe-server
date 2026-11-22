import {z} from 'zod';
import {DEMO_MODE,all,findOne,insert,update,remove} from '../data.js';
import {verifyToken,verifyStudent} from '../auth.js';
import {asyncRoute,err} from '../shared.js';

export function registerStudentRoutes(app){
app.post('/api/applications',verifyToken,verifyStudent,asyncRoute(async(req,res)=>{
 const valid=z.object({tuitionId:z.string().min(1),studentPhone:z.string().trim().min(7),preferredSchedule:z.string().trim().min(3),studentNote:z.string().trim().min(5)}).safeParse(req.body);
 if(!valid.success)return err(res,'Enter a valid phone, preferred schedule and short learning note.');
 const t=await findOne('tuitions',{id:valid.data.tuitionId});if(!t||t.approvalStatus!=='approved'||!t.isActive)return err(res,'Listing is no longer accepting applications.',404);
 if(await findOne('applications',{tuitionId:t.id,studentEmail:req.user.email}))return err(res,'You have already applied for this tuition.',409);
 const item=await insert('applications',{tuitionId:t.id,tuitionTitle:t.title,subject:t.subject,monthlyFee:t.monthlyFee,tutorName:t.tutorName,tutorEmail:t.tutorEmail,studentName:req.user.name,studentEmail:req.user.email,studentPhone:valid.data.studentPhone,preferredSchedule:valid.data.preferredSchedule,studentNote:valid.data.studentNote,status:'pending',appliedAt:new Date().toISOString()});res.status(201).json({application:item});
}));
app.get('/api/student/applications',verifyToken,verifyStudent,asyncRoute(async(req,res)=>res.json({items:(await all('applications')).filter(a=>a.studentEmail===req.user.email).sort((a,b)=>b.appliedAt.localeCompare(a.appliedAt))})));
app.delete('/api/student/applications/:id',verifyToken,verifyStudent,asyncRoute(async(req,res)=>{
 const a=await findOne('applications',{id:req.params.id});if(!a||a.studentEmail!==req.user.email)return err(res,'Application not found.',404);if(a.status!=='pending')return err(res,'Only pending applications can be cancelled.');await remove('applications',{id:a.id});res.json({success:true});
}));
app.get('/api/student/bookmarks',verifyToken,verifyStudent,asyncRoute(async(req,res)=>{const ids=Array.isArray(req.user.savedTuitions)?req.user.savedTuitions:typeof req.user.savedTuitions==='string'?req.user.savedTuitions.split(',').filter(Boolean):[];res.json({items:(await all('tuitions')).filter(t=>ids.includes(t.id)&&t.approvalStatus==='approved'&&t.isActive),ids});}));
app.post('/api/student/bookmarks/:id',verifyToken,verifyStudent,asyncRoute(async(req,res)=>{const t=await findOne('tuitions',{id:req.params.id});if(!t||t.approvalStatus!=='approved'||!t.isActive)return err(res,'Tuition not found.',404);let ids=Array.isArray(req.user.savedTuitions)?req.user.savedTuitions:typeof req.user.savedTuitions==='string'?req.user.savedTuitions.split(',').filter(Boolean):[];ids=ids.includes(t.id)?ids.filter(x=>x!==t.id):[...ids,t.id];await update('users',{id:req.user.id},{savedTuitions:DEMO_MODE?ids:ids.join(',')});res.json({ids,saved:ids.includes(t.id)});}));
}
