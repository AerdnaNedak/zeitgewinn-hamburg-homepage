// Nur für das Mockup: rendert Karten und Filter aus den Beispieldaten.
(function(){
  const {posts,cats}=window.SAMPLE;
  const byId=Object.fromEntries(cats.map(c=>[c.id,c]));
  const fmt=d=>new Date(d).toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'});
  const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // Oberkategorie "Artikel" trägt fast jeder Beitrag, deshalb nicht als Schlagwort zeigen.
  const tagsOf=p=>p.cats.map(i=>byId[i]).filter(c=>c&&c.id!==75);
  window.card=p=>`<a class="card" href="artikel.html">
    <div class="card-img"><img src="${p.image}" alt="" loading="lazy"></div>
    <div class="card-body"><time datetime="${p.date}">${fmt(p.date)}</time>
      <h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p>
      <div class="tags">${tagsOf(p).slice(0,3).map(c=>`<span class="tag">${esc(c.name)}</span>`).join('')}</div></div></a>`;
  document.querySelectorAll('[data-cards]').forEach(el=>{
    const n=+el.dataset.cards||posts.length;
    el.innerHTML=posts.slice(+el.dataset.skip||0,(+el.dataset.skip||0)+n).map(card).join('');
  });

  const filter=document.querySelector('.filter');
  if(!filter) return;
  const groups=[
    {title:'Artikel',parent:75},
    {title:'Coole Tools',parent:83,self:true},
    {title:'Literaturtipps',parent:66,self:true},
    {title:'Weitere Themen',parent:0,exclude:[75,83,66]}
  ];
  const btn=c=>`<li><button type="button" data-id="${c.id}" aria-pressed="false">${esc(c.name)} <span>${c.count}</span></button></li>`;
  let html='<ul><li><button type="button" data-id="" aria-pressed="true">Alle Artikel <span>210</span></button></li></ul>';
  for(const g of groups){
    let list=cats.filter(c=>c.parent===g.parent&&!(g.exclude||[]).includes(c.id));
    list.sort((a,b)=>b.count-a.count);
    html+=`<h2>${g.title}</h2><ul>${list.map(btn).join('')}</ul>`;
  }
  filter.querySelector('.filter-body').innerHTML=html;
  const grid=document.querySelector('#grid'), info=document.querySelector('#info'), q=document.querySelector('#q');
  let active='';
  function render(){
    const term=q.value.trim().toLowerCase();
    const want=active?[+active,...cats.filter(c=>c.parent===+active).map(c=>c.id)]:null;
    const hits=posts.filter(p=>(!want||p.cats.some(i=>want.includes(i)))&&(!term||(p.title+' '+p.excerpt).toLowerCase().includes(term)));
    grid.innerHTML=hits.map(card).join('')||'<p>Keine Artikel gefunden.</p>';
    const name=active?byId[active].name:'Alle Themen';
    info.innerHTML=`<span><strong>${hits.length}</strong> Artikel · ${esc(name)}</span>`;
    filter.querySelectorAll('button[data-id]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===String(active)));
  }
  filter.addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(!b)return;active=b.dataset.id;render();
    if(matchMedia('(max-width:900px)').matches) filter.querySelector('details').open=false;});
  q.addEventListener('input',render);
  const d=filter.querySelector('details');
  const mq=matchMedia('(max-width:900px)'); const sync=()=>{d.open=!mq.matches}; mq.addEventListener('change',sync); sync();
  render();
})();
