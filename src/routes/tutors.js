import {all,findOne,insert,update,remove} from '../data.js';
import {verifyToken,verifyTutor} from '../auth.js';
import {asyncRoute,err,tuitionSchema,sampleImage} from '../shared.js';

export function registerTutorRoutes(app){
app.get('/api/tutor/tuitions',verifyToken,verifyTutor,asyncRoute(async(req,res)=>res.json({items:(await all('tuitions')).filter(t=>t.tutorEmail===req.user.email).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))})));
app.post('/api/tutor/tuitions',verifyToken,verifyTutor,asyncRoute(async(req,res)=>{
 const parsed=tuitionSchema.safeParse(req.body);if(!parsed.success)return err(res,parsed.error.issues[0].message);
 const count=(await all('tuitions')).filter(t=>t.tutorEmail===req.user.email).length;
 if(req.user.plan!=='pro'&&count>=2)return err(res,'Free tutors can post up to two tuitions. Upgrade to Pro for unlimited posts.',403);
 const tuition=await insert('tuitions',{...parsed.data,bannerImage:parsed.data.bannerImage||sampleImage,tutorId:req.user.id,tutorName:req.user.name,tutorEmail:req.user.email,approvalStatus:'pending',isActive:true,createdAt:new Date().toISOString()});res.status(201).json({tuition});
}));
app.patch('/api/tutor/tuitions/:id',verifyToken,verifyTutor,asyncRoute(async(req,res)=>{
 const old=await findOne('tuitions',{id:req.params.id});if(!old||old.tutorEmail!==req.user.email)return err(res,'Listing not found.',404);
 const patch={};if(typeof req.body.isActive==='boolean')patch.isActive=req.body.isActive;
 else {const parsed=tuitionSchema.safeParse(req.body);if(!parsed.success)return err(res,parsed.error.issues[0].message);Object.assign(patch,parsed.data,{approvalStatus:'pending'});}
 res.json({tuition:await update('tuitions',{id:old.id},patch)});
}));
app.delete('/api/tutor/tuitions/:id',verifyToken,verifyTutor,asyncRoute(async(req,res)=>{
 const t=await findOne('tuitions',{id:req.params.id});if(!t||t.tutorEmail!==req.user.email)return err(res,'Listing not found.',404);
 await remove('tuitions',{id:t.id});res.json({success:true});
}));
app.get('/api/tutor/applicants',verifyToken,verifyTutor,asyncRoute(async(req,res)=>{
 const [applications, users] = await Promise.all([all('applications'), all('users')]);
 const proEmails = new Set(users.filter(user => user.plan === 'pro').map(user => user.email));
 const items = applications
  .filter(application => application.tutorEmail === req.user.email)
  .map(application => ({...application, isPriority: proEmails.has(application.studentEmail)}))
  .sort((a, b) => Number(b.isPriority) - Number(a.isPriority) ||
   String(b.appliedAt ?? '').localeCompare(String(a.appliedAt ?? '')));
 res.json({items});
}));
app.patch('/api/tutor/applicants/:id',verifyToken,verifyTutor,asyncRoute(async(req,res)=>{
 if(!['accepted','rejected'].includes(req.body?.status))return err(res,'Invalid application status.');const a=await findOne('applications',{id:req.params.id});if(!a||a.tutorEmail!==req.user.email)return err(res,'Application not found.',404);
 res.json({application:await update('applications',{id:a.id},{status:req.body.status})});
}));
}
