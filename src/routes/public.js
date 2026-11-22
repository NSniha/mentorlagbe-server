import {all,findOne,publicTuitions} from '../data.js';
import {optionalUser} from '../auth.js';
import {asyncRoute,err} from '../shared.js';

export function registerPublicRoutes(app){
app.get('/api/tuitions',asyncRoute(async(req,res)=>res.json(await publicTuitions(req.query))));
app.get('/api/subjects',asyncRoute(async(_req,res)=>{
 const rows=await all('tuitions');res.json({subjects:[...new Set(rows.filter(t=>t.approvalStatus==='approved').map(t=>t.subject))].sort(),classLevels:[...new Set(rows.map(t=>t.classLevel))].sort()});
}));
app.get('/api/tuitions/:id',optionalUser,asyncRoute(async(req,res)=>{
 const tuition=await findOne('tuitions',{id:req.params.id});if(!tuition)return err(res,'Tuition not found.',404);
 if((tuition.approvalStatus!=='approved'||!tuition.isActive)&&req.user?.email!==tuition.tutorEmail&&req.user?.role!=='admin')return err(res,'This listing is unavailable.',404);
 const tutor=await findOne('users',{email:tuition.tutorEmail});res.json({tuition,tutor:tutor?{name:tutor.name,image:tutor.image,bio:tutor.bio,plan:tutor.plan}:null});
}));
}
