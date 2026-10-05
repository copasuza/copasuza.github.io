const API='https://script.google.com/macros/s/AKfycbxgX5aZ-d1fvYwO4plIa9RWPgLo9E8Afod2DnlXvVMYGT3Qukk4JDtHXZuiTgpI6QoGlA/exec';
const qs=new URLSearchParams(location.search);
const accessToken=(qs.get('access_token')||'').trim();
const team=(qs.get('team')||'').trim();
const tournament=(qs.get('tournament')||'').trim();

const form=document.getElementById('registrationForm');
const info=document.getElementById('teamInfo');
const status=document.getElementById('status');
const result=document.getElementById('result');
const players=document.getElementById('players');

function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

for(let i=1;i<=12;i++){
  const row=document.createElement('div');
  row.className='player';
  row.innerHTML=`<div class="num">${i}</div><label>نام و نام خانوادگی<input class="player-name" data-index="${i}" required></label><label>نام پدر<input class="father-name" data-index="${i}" required></label>`;
  players.appendChild(row);
}

if(!accessToken||!team||!tournament){
  info.textContent='لینک ثبت‌نام کامل نیست یا معتبر نیست.';
}else{
  info.innerHTML=`تورنمنت: ${esc(tournament)} &nbsp; | &nbsp; تیم: ${esc(team)}`;
  form.classList.remove('hidden');
}

form.addEventListener('submit',async e=>{
  e.preventDefault();
  status.className='status';
  status.textContent='در حال ثبت اطلاعات...';
  const btn=document.getElementById('submitBtn');
  btn.disabled=true;
  try{
    const p=[];
    for(let i=1;i<=12;i++){
      const full=document.querySelector(`.player-name[data-index="${i}"]`).value.trim();
      const father=document.querySelector(`.father-name[data-index="${i}"]`).value.trim();
      if(!full||!father) throw new Error(`اطلاعات بازیکن ${i} کامل نیست.`);
      p.push({full_name:full,father_name:father});
    }
    const payload={api:1,access_token:accessToken,team_name:team,head_coach:document.getElementById('headCoach').value.trim(),coach:document.getElementById('coach').value.trim(),manager:document.getElementById('manager').value.trim(),medic:document.getElementById('medic').value.trim(),players:p};
    if(!payload.head_coach||!payload.manager) throw new Error('نام سرمربی و سرپرست الزامی است.');
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const text=await r.text();
    let data;try{data=JSON.parse(text)}catch(_){throw new Error('پاسخ سامانه قابل خواندن نیست.');}
    if(!r.ok||data.success===false)throw new Error(data.message||'ثبت اطلاعات انجام نشد.');
    form.classList.add('hidden');
    result.className='card result-ok';
    result.innerHTML=`<h2>✅ ثبت اطلاعات با موفقیت انجام شد</h2><p>اطلاعات تیم <strong>${esc(team)}</strong> برای بررسی ارسال شد.</p>${data.reference?`<div class="ref">کد پیگیری: ${esc(data.reference)}</div>`:''}`;
  }catch(err){
    status.className='status error';
    status.textContent=err.message||'خطای نامشخص';
    btn.disabled=false;
  }
});
