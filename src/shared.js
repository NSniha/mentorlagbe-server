import {z} from 'zod';
export const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export const err=(res,message,status=400)=>res.status(status).json({error:message});
export const clean=s=>String(s||'').trim();
export const tuitionSchema=z.object({title:z.string().trim().min(8).max(120),subject:z.string().trim().min(2),classLevel:z.string().trim().min(2),mode:z.enum(['Online','Offline']),location:z.string().trim().min(2),monthlyFee:z.coerce.number().positive().max(1000000),daysPerWeek:z.coerce.number().int().min(1).max(7),description:z.string().trim().min(20),bannerImage:z.string().url().optional().or(z.literal(''))});
export const sampleImage='https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80';
export const billingAmount=role=>role==='tutor'?1500:1000;
