import multer from 'multer';
import {verifyToken} from '../auth.js';
import {asyncRoute,err} from '../shared.js';

export function registerMediaRoutes(app){
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
app.post('/api/images/upload',verifyToken,upload.single('image'),asyncRoute(async(req,res)=>{
 if(!req.file)return err(res,'Choose a JPEG, PNG or WebP image (up to 5MB).');if(!process.env.IMGBB_API_KEY)return err(res,'ImgBB key is not configured yet.',503);
 const body=new URLSearchParams({key:process.env.IMGBB_API_KEY,image:req.file.buffer.toString('base64')});const response=await fetch('https://api.imgbb.com/1/upload',{method:'POST',body});const result=await response.json();if(!response.ok||!result.success)return err(res,'Image upload failed.',502);res.json({url:result.data.url});
}));
}
