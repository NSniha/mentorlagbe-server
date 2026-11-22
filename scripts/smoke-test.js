// Run while the API is running in local demo mode: npm run smoke
import assert from 'node:assert/strict';
const base=process.env.TEST_API_URL||'http://localhost:5000';
let passed=0;
async function api(path,{method='GET',body,token}={}){
 const headers={};if(body)headers['Content-Type']='application/json';if(token)headers.Authorization=`Bearer ${token}`;
 const res=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined});
 return {status:res.status,data:await res.json()};
}
const check=(condition,name)=>{assert(condition,name);console.log('PASS:',name);passed++};
const health=await api('/api/health');check(health.status===200&&health.data.mode==='demo','Demo API health');
const listings=await api('/api/tuitions?limit=20');check(listings.status===200&&listings.data.total>=12,'Twelve or more approved listings');
const login=async(email)=>{const res=await api('/api/demo/login',{method:'POST',body:{email,password:'Demo12345!'}});check(res.status===200,'Sign in '+email);return res.data.token;};
const badPassword=await api('/api/demo/login',{method:'POST',body:{email:'student@mentorlagbe.demo',password:{value:'invalid'}}});
check(badPassword.status===401,'Malformed password returns a login error');
const badPage=await api('/api/tuitions?page=1.5&limit=Infinity');
check(badPage.status===200&&badPage.data.page===1&&badPage.data.items.length===9,'Invalid pagination uses defaults');
const lastPage=await api('/api/tuitions?page=99999&limit=5');
check(lastPage.status===200&&lastPage.data.page===lastPage.data.pages&&lastPage.data.items.length>0,'Out-of-range page falls back to the last page');
const student=await login('student@mentorlagbe.demo');
const tutor=await login('farhan@mentorlagbe.demo');
const admin=await login('admin@mentorlagbe.demo');
const me=await api('/api/me',{token:student});check(me.data.user.role==='student','JWT verified student profile');
const rejected=await api('/api/applications',{method:'POST',token:tutor,body:{tuitionId:'tuition-1',studentPhone:'01700000000',preferredSchedule:'Sunday',studentNote:'Help please'}});check(rejected.status===403,'Tutors cannot submit student applications');
const filtered=await api('/api/tuitions?mode=Offline&subject=Physics');check(filtered.data.total>=1&&filtered.data.items.every(x=>x.mode==='Offline'&&x.subject==='Physics'),'Server-side search and filters');
const unique='smoke-'+Date.now();
const newUser=await api('/api/demo/register',{method:'POST',body:{name:'Smoke Test Tutor',email:unique+'@example.test',password:'Demo12345!',role:'tutor'}});check(newUser.status===201,'Role-based registration');
const newTutor=newUser.data.token;
const template={title:'Smoke Test Full Stack Mathematics',subject:'Mathematics',classLevel:'HSC / Class 11–12',mode:'Online',location:'Dhaka',monthlyFee:3100,daysPerWeek:3,description:'This is a realistic and fully validated sample tuition record for smoke testing.',bannerImage:'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80'};
const posts=[];
const pendingSubject='Smoke Subject '+unique;
for(let i=0;i<2;i++){const r=await api('/api/tutor/tuitions',{method:'POST',token:newTutor,body:{...template,title:template.title+' '+i,subject:i===1?pendingSubject:template.subject,classLevel:i===1?pendingSubject:template.classLevel}});check(r.status===201,'Tutor creates pending listing '+i);posts.push(r.data.tuition.id);}
const filters=await api('/api/subjects');
check(filters.status===200&&!filters.data.subjects.includes(pendingSubject)&&!filters.data.classLevels.includes(pendingSubject),'Pending tuitions do not appear in public filters');
const tooMany=await api('/api/tutor/tuitions',{method:'POST',token:newTutor,body:{...template,title:template.title+' extra'}});check(tooMany.status===403,'Free plan enforces maximum 2 listings');
const approval=await api('/api/admin/tuitions/'+posts[0],{method:'PATCH',token:admin,body:{approvalStatus:'approved'}});check(approval.status===200,'Admin approves tutor listing');
const detail=await api('/api/tuitions/'+posts[0]);check(detail.status===200,'Approved tuition appears publicly');
const application=await api('/api/applications',{method:'POST',token:student,body:{tuitionId:posts[0],studentPhone:'01700000999',preferredSchedule:'Sunday evening',studentNote:'Looking for math help.'}});check(application.status===201,'Student applies successfully');
const duplicate=await api('/api/applications',{method:'POST',token:student,body:{tuitionId:posts[0],studentPhone:'01700000999',preferredSchedule:'Sunday evening',studentNote:'Looking for math help.'}});check(duplicate.status===409,'Duplicate application rejected');
const applicant=await api('/api/tutor/applicants',{token:newTutor});check(applicant.data.items.some(x=>x.tuitionId===posts[0]),'Tutor receives applicant');
const accepted=await api('/api/tutor/applicants/'+application.data.application.id,{method:'PATCH',token:newTutor,body:{status:'accepted'}});check(accepted.status===200,'Tutor accepts application');
const cannotCancel=await api('/api/student/applications/'+application.data.application.id,{method:'DELETE',token:student});check(cannotCancel.status===400,'Accepted application cannot be cancelled');
const bookmarked=await api('/api/student/bookmarks/'+posts[0],{method:'POST',token:student});check(bookmarked.status===200,'Student can bookmark listings');
const profile=await api('/api/me',{method:'PATCH',token:newTutor,body:{name:'Smoke Test Tutor',phone:'01799999999',bio:'A demo mentor profile.',image:''}});check(profile.status===200,'Profile can be updated');
for(const id of posts){const deleted=await api('/api/tutor/tuitions/'+id,{method:'DELETE',token:newTutor});check(deleted.status===200,'Tutor can delete own listing');}
const payment=await api('/api/payments/checkout',{method:'POST',token:student,body:{}});check(payment.status===503,'Demo does not fabricate Stripe payments');
console.log(`\n${passed} smoke checks passed. Note: smoke testing creates one demo test tutor and one accepted sample application. Delete server/.data/demo.json to reset demo records.`);
