import jwt from 'jsonwebtoken';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { fromNodeHeaders } from 'better-auth/node';
import { database, findOne, DEMO_MODE } from './data.js';

const jwtSecret=()=>process.env.JWT_SECRET||'local-development-jwt-secret-change-in-production';
let auth;
export function initAuth(){
 if(DEMO_MODE)return;
 if(!process.env.BETTER_AUTH_SECRET||process.env.BETTER_AUTH_SECRET.length<32||!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw new Error('Set strong BETTER_AUTH_SECRET and JWT_SECRET in server/.env');
 auth=betterAuth({
  database:mongodbAdapter(database()),
  baseURL:process.env.SERVER_PUBLIC_URL||'http://localhost:5000',
  trustedOrigins:[process.env.CLIENT_URL||'http://localhost:3000'],
  secret:process.env.BETTER_AUTH_SECRET,
  advanced: process.env.NODE_ENV==='production'?{defaultCookieAttributes:{sameSite:'none',secure:true,httpOnly:true}}:undefined,
  emailAndPassword:{enabled:true,minPasswordLength:8},
  user:{modelName:'users',additionalFields:{
    role:{type:'string',required:false,defaultValue:'student',input:true},
    plan:{type:'string',required:false,defaultValue:'free',input:false},
    phone:{type:'string',required:false,defaultValue:'',input:false},
    bio:{type:'string',required:false,defaultValue:'',input:false},
    savedTuitions:{type:'string',required:false,defaultValue:'',input:false}
  }},
  databaseHooks:{user:{create:{before:async (user)=>({data:{...user,role:user.role==='tutor'?'tutor':'student',plan:'free'}})}}}
 });
}
export const getAuth=()=>auth;
export const makeToken=(user)=>jwt.sign({sub:user.email},jwtSecret(),{expiresIn:'2h',issuer:'mentorlagbe'});
export const verifyToken=async(req,res,next)=>{
 try{const value=req.headers.authorization||'';if(!value.startsWith('Bearer '))return res.status(401).json({error:'Please sign in to continue.'});const decoded=jwt.verify(value.slice(7),jwtSecret(),{issuer:'mentorlagbe'});const user=await findOne('users',{email:decoded.sub});if(!user)return res.status(401).json({error:'Your session has expired.'});req.user=user;next();}catch{return res.status(401).json({error:'Session expired. Please sign in again.'});}
};
export const optionalUser=async(req,res,next)=>{if(!req.headers.authorization)return next();return verifyToken(req,res,next);};
export const only=(role)=>(req,res,next)=>req.user?.role===role?next():res.status(403).json({error:`Only ${role}s can perform this action.`});
export const verifyStudent=only('student');
export const verifyTutor=only('tutor');
export const verifyAdmin=only('admin');
export async function tokenFromBetterAuth(req,res){
 if(DEMO_MODE)return res.status(400).json({error:'Demo mode uses local sign in.'});
 const session=await auth.api.getSession({headers:fromNodeHeaders(req.headers)});
 if(!session?.user)return res.status(401).json({error:'You are not signed in.'});
 const user=await findOne('users',{email:session.user.email});if(!user)return res.status(401).json({error:'Account not found.'});
 res.json({token:makeToken(user),user:safeUser(user)});
}
export function safeUser(u){if(!u)return null;const {passwordHash,...rest}=u;return rest;}
