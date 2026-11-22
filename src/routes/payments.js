import express from 'express';
import {findOne,insert,update} from '../data.js';
import {verifyToken} from '../auth.js';
import {asyncRoute,err,clean,billingAmount} from '../shared.js';
async function fulfillCheckout(session){
 if(session.payment_status!=='paid'||session.metadata?.purpose!=='mentorlagbe_pro')return;
 const email=session.metadata?.email,role=session.metadata?.role;
 if(!email || !['tutor','student'].includes(role))return;
 const user=await findOne('users',{email});
 if(!user||user.role!==role||session.amount_total!==billingAmount(role)||session.currency!=='usd')return;
 if(await findOne('payments',{stripeSessionId:session.id})){await update('users',{email},{plan:'pro'});return;}
 await insert('payments',{userEmail:user.email,userName:user.name,userRole:role,planName:`Pro ${role==='tutor'?'Tutor':'Student'}`,amount:session.amount_total/100,currency:'usd',transactionId:typeof session.payment_intent==='string'?session.payment_intent:session.id,stripeSessionId:session.id,paymentStatus:'paid',paidAt:new Date().toISOString(),subscriptionId:typeof session.subscription==='string'?session.subscription:''});
 await update('users',{email},{plan:'pro'});
}
async function fulfillRenewal(invoice,stripe){
 const subscriptionId=typeof invoice.subscription==='string'?invoice.subscription:invoice.parent?.subscription_details?.subscription;
 if(!subscriptionId)return;
 const subscription=await stripe.subscriptions.retrieve(subscriptionId);
 const {purpose,email,role}=subscription.metadata||{};
 if(purpose!=='mentorlagbe_pro'||!email||!['student','tutor'].includes(role))return;
 const user=await findOne('users',{email});if(!user||user.role!==role)return;
 if(await findOne('payments',{transactionId:invoice.id})){await update('users',{email},{plan:'pro'});return;}
 await insert('payments',{userEmail:email,userName:user.name,userRole:role,planName:`Pro ${role==='tutor'?'Tutor':'Student'} (renewal)`,amount:(invoice.amount_paid||0)/100,currency:invoice.currency||'usd',transactionId:invoice.id,subscriptionId,paymentStatus:'paid',paidAt:new Date().toISOString()});
 await update('users',{email},{plan:'pro'});
}
async function endSubscription(subscription){
 const {purpose,email}=subscription.metadata||{};
 if(purpose!=='mentorlagbe_pro'||!email)return;
 const user=await findOne('users',{email});if(user)await update('users',{email},{plan:'free'});
}
export function registerStripeWebhook(app,stripe){
// Stripe signature must be verified against the original raw body, BEFORE express.json.
app.post('/api/payments/webhook',express.raw({type:'application/json'}),asyncRoute(async(req,res)=>{
 if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET)return err(res,'Stripe is not configured.',503);
 let event;try{event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET);}catch{return err(res,'Invalid Stripe signature.',400);}
 if(event.type==='checkout.session.completed')await fulfillCheckout(event.data.object);
 if(event.type==='invoice.paid'&&event.data.object.billing_reason!=='subscription_create')await fulfillRenewal(event.data.object,stripe);
 if(event.type==='customer.subscription.deleted')await endSubscription(event.data.object);
 res.json({received:true});
}));
}
export function registerPaymentRoutes(app,stripe,clientOrigin){
app.post('/api/payments/checkout',verifyToken,asyncRoute(async(req,res)=>{
 if(!['student','tutor'].includes(req.user.role))return err(res,'Admins do not need a subscription.',403);
 if(req.user.plan==='pro')return err(res,'You already have a Pro subscription.');
 if(!stripe)return err(res,'Stripe is not configured yet. Add Stripe API keys to enable real payments.',503);
 const session=await stripe.checkout.sessions.create({mode:'subscription',payment_method_types:['card'],customer_email:req.user.email,line_items:[{price_data:{currency:'usd',product_data:{name:`MentorLagbe Pro ${req.user.role==='tutor'?'Tutor':'Student'}`},unit_amount:billingAmount(req.user.role),recurring:{interval:'month'}},quantity:1}],success_url:`${clientOrigin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${clientOrigin}/payment/cancel`,metadata:{purpose:'mentorlagbe_pro',email:req.user.email,role:req.user.role,userId:req.user.id},subscription_data:{metadata:{purpose:'mentorlagbe_pro',email:req.user.email,role:req.user.role}}});res.json({url:session.url});
}));
app.get('/api/payments/verify',verifyToken,asyncRoute(async(req,res)=>{if(!stripe)return err(res,'Stripe is not configured.',503);const sessionId=clean(req.query.session_id);if(!sessionId.startsWith('cs_'))return err(res,'Invalid session ID.');const session=await stripe.checkout.sessions.retrieve(sessionId);if(session.metadata?.email!==req.user.email)return err(res,'Payment session belongs to another account.',403);await fulfillCheckout(session);const updated=await findOne('users',{id:req.user.id});res.json({paid:session.payment_status==='paid',plan:updated?.plan||'free'});}));
}
