import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {DEMO_MODE,findOne,insert,update} from '../data.js';
import {makeToken,safeUser,verifyToken,tokenFromBetterAuth} from '../auth.js';
import {asyncRoute,err} from '../shared.js';

export function registerAccountRoutes(app){
app.post('/api/demo/register',asyncRoute(async(req,res)=>{
 if(!DEMO_MODE)return err(res,'Demo registration is disabled in production.',404);
 const parsed=z.object({name:z.string().trim().min(2),email:z.string().email(),password:z.string().min(8),role:z.enum(['student','tutor'])}).safeParse(req.body);
 if(!parsed.success)return err(res,'Please fill in all fields correctly. Password must be 8+ characters.');
 const {name,email,password,role}=parsed.data;const normalized=email.toLowerCase();if(await findOne('users',{email:normalized}))return err(res,'Email is already registered.',409);
 const user=await insert('users',{name,email:normalized,passwordHash:await bcrypt.hash(password,12),role,plan:'free',image:'',phone:'',bio:'',savedTuitions:[],createdAt:new Date().toISOString()});res.status(201).json({token:makeToken(user),user:safeUser(user)});
}));
app.post('/api/demo/login',asyncRoute(async(req,res)=>{
 if(!DEMO_MODE)return err(res,'Demo login is disabled in production.',404);
 const {email, password} = req.body || {};
 if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
  return err(res, 'Incorrect email or password.', 401);
 }
 const user = await findOne('users', {email: email.trim().toLowerCase()});
 if (!user || !await bcrypt.compare(password, user.passwordHash || '')) {
  return err(res, 'Incorrect email or password.', 401);
 }
 res.json({token:makeToken(user),user:safeUser(user)});
}));
app.post('/api/token',asyncRoute(tokenFromBetterAuth));
app.get('/api/me',verifyToken,(req,res)=>res.json({user:safeUser(req.user)}));
app.patch('/api/me',verifyToken,asyncRoute(async(req,res)=>{
 const valid=z.object({name:z.string().trim().min(2).max(80),phone:z.string().trim().max(30).optional(),bio:z.string().trim().max(500).optional(),image:z.string().url().optional().or(z.literal(''))}).safeParse(req.body);
 if(!valid.success)return err(res,'Please enter a valid name, phone, bio and image URL.');
 const user=await update('users',{id:req.user.id},valid.data);res.json({user:safeUser(user)});
}));
}
