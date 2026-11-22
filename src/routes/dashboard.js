import {all} from '../data.js';
import {verifyToken} from '../auth.js';
import {asyncRoute} from '../shared.js';

export function registerDashboardRoutes(app){
app.get('/api/dashboard/summary',verifyToken,asyncRoute(async(req,res)=>{
 const [users,tuitions,applications,payments]=await Promise.all(['users','tuitions','applications','payments'].map(all));
 if(req.user.role==='student'){const list=applications.filter(a=>a.studentEmail===req.user.email);return res.json({stats:[['Total applications',list.length],['Accepted',list.filter(a=>a.status==='accepted').length],['Pending',list.filter(a=>a.status==='pending').length],['Your plan',req.user.plan.toUpperCase()]]});}
 if(req.user.role==='tutor'){const list=tuitions.filter(t=>t.tutorEmail===req.user.email);return res.json({stats:[['My tuitions',list.length],['Approved & live',list.filter(t=>t.approvalStatus==='approved'&&t.isActive).length],['Applicants',applications.filter(a=>a.tutorEmail===req.user.email).length],['Your plan',req.user.plan.toUpperCase()]]});}
 return res.json({stats:[['Total users',users.length],['Tutors',users.filter(u=>u.role==='tutor').length],['Pending tuitions',tuitions.filter(t=>t.approvalStatus==='pending').length],['Stripe revenue','$'+payments.reduce((sum,p)=>sum+Number(p.amount||0),0).toFixed(2)]]});
}));
}
