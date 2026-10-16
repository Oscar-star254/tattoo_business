// Vercel serverless function: availability (GET) and booking + Stripe Checkout in USD (POST)
const N=["Free consultation","Custom design drawing","Tribal tattoo","Japanese tattoo","Fine line tattoo","Blackwork tattoo","Realism & colour tattoo","Cover-up","Lettering & script","Touch-up"];
const P=[0,60,120,180,120,150,220,250,90,50],Z=[1,2,3.5,6],T=["10:00","11:30","13:00","14:30","16:00","17:00"];
const K=process.env.STRIPE_SECRET_KEY;
const stripe=(path,body)=>fetch('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+K,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:body?new URLSearchParams(body):undefined}).then(r=>r.json());
const taken=async d=>{if(!K)return[];const r=await stripe('checkout/sessions?limit=100');return(r.data||[]).filter(s=>s.payment_status==='paid'&&s.metadata&&s.metadata.date===d).map(s=>s.metadata.slot)};
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  try{
    if(req.method==='GET'){const d=String(req.query.date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return res.status(400).json({error:'Bad date'});return res.json({taken:await taken(d)})}
    if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
    const b=req.body||{},s=+b.service,z=+b.size,e=String(b.email||'').trim(),d=String(b.date||'');
    if(!(s>=0&&s<N.length)||!(z>=0&&z<Z.length))return res.status(400).json({error:'Choose a service and size.'});
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||new Date(d+'T12:00').getDay()===1||d<new Date().toISOString().slice(0,10))return res.status(400).json({error:'Choose an open date.'});
    if(!T.includes(b.slot))return res.status(400).json({error:'Choose a time.'});
    if(!/^\S+@\S+\.\S+$/.test(e)||!String(b.name||'').trim()||!b.adult)return res.status(400).json({error:'Name, valid email and 18+ confirmation are required.'});
    if((await taken(d)).includes(b.slot))return res.status(409).json({error:'That time was just booked. Pick another.'});
    const m=s===1?1+(Z[z]-1)*.3:Z[z],base=P[s]?Math.round(P[s]*m/5)*5:0,tot=base+(P[s]&&s!==1&&b.addon?40:0),dep=P[s]?Math.max(30,Math.round(tot*.25)):0;
    const ref='EI-'+Math.random().toString(36).slice(2,8).toUpperCase(),site=process.env.SITE_URL||`https://${req.headers.host}`;
    const meta={ref,service:N[s],size:Z[z]+'x',date:d,slot:b.slot,name:String(b.name).slice(0,100),phone:String(b.phone||'').slice(0,40),placement:String(b.placement||'').slice(0,60),design:String(b.design||'').slice(0,100),addon:b.addon?'yes':'no',total_usd:String(tot),notes:String(b.notes||'').slice(0,450)};
    if(!dep){
      if(process.env.RESEND_API_KEY&&process.env.BOOKING_EMAIL)await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.FROM_EMAIL,to:process.env.BOOKING_EMAIL,reply_to:e,subject:'Consultation '+ref+' '+d+' '+b.slot,text:Object.entries({...meta,email:e}).map(([k,v])=>k+': '+v).join('\n')})});
      return res.json({ok:true,ref});
    }
    if(!K)return res.status(500).json({error:'Payments are not configured yet (missing STRIPE_SECRET_KEY).'});
    const body={mode:'payment',customer_email:e,success_url:`${site}/?paid=1&ref=${ref}#book`,cancel_url:`${site}/#book`,'line_items[0][quantity]':'1','line_items[0][price_data][currency]':'usd','line_items[0][price_data][unit_amount]':String(dep*100),'line_items[0][price_data][product_data][name]':`${N[s]} deposit (${ref})`,'line_items[0][price_data][product_data][description]':`${d} at ${b.slot}. Estimated total $${tot}. Balance due at your session.`};
    for(const[k,v]of Object.entries({...meta,email:e}))body[`metadata[${k}]`]=v;
    const r=await stripe('checkout/sessions',body);
    if(!r.url)return res.status(502).json({error:(r.error&&r.error.message)||'Stripe error'});
    res.json({url:r.url,ref});
  }catch(x){res.status(500).json({error:'Server error. Please try again.'})}
};
