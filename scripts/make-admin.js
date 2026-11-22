import 'dotenv/config';
import {connectData,DEMO_MODE,findOne,update} from '../src/data.js';
const email=process.argv[2]?.toLowerCase();
if(!email)throw new Error('Usage: npm run make-admin -- admin@example.com');
if(DEMO_MODE)throw new Error('Demo mode already has an admin. Use this command only with MongoDB enabled.');
await connectData();const user=await findOne('users',{email});if(!user)throw new Error('Account not found; first register normally, then promote it from the trusted server console.');
await update('users',{email},{role:'admin'});console.log(`Admin role granted to ${email}.`);process.exit(0);
