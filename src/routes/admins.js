import {all,findOne,update} from '../data.js';
import {verifyToken,verifyAdmin,safeUser} from '../auth.js';
import {asyncRoute,err} from '../shared.js';

export function registerAdminRoutes(app){
app.get('/api/admin/users',verifyToken,verifyAdmin,asyncRoute(async(_req,res)=>res.json({items:(await all('users')).map(safeUser)})));
app.patch('/api/admin/users/:id',verifyToken,verifyAdmin,asyncRoute(async(req,res)=>{
 if(!['student','tutor','admin'].includes(req.body.role))return err(res,'Invalid role.');if(req.user.id===req.params.id&&req.body.role!=='admin')return err(res,'You cannot remove your own admin role.');
 const target=await findOne('users',{id:req.params.id});if(!target)return err(res,'User not found.',404);
 res.json({user:safeUser(await update('users',{id:target.id},{role:req.body.role}))});
}));
app.get('/api/admin/tuitions',verifyToken,verifyAdmin,asyncRoute(async(_req,res)=>res.json({items:(await all('tuitions')).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))})));
app.patch('/api/admin/tuitions/:id',verifyToken,verifyAdmin,asyncRoute(async(req,res)=>{if(!['approved','rejected','pending'].includes(req.body.approvalStatus))return err(res,'Invalid approval status.');const t=await findOne('tuitions',{id:req.params.id});if(!t)return err(res,'Listing not found.',404);res.json({tuition:await update('tuitions',{id:t.id},{approvalStatus:req.body.approvalStatus})});}));
app.get('/api/admin/transactions',verifyToken,verifyAdmin,asyncRoute(async(_req,res)=>res.json({items:(await all('payments')).sort((a,b)=>b.paidAt.localeCompare(a.paidAt))})));
}
