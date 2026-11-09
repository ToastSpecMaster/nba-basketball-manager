/* NBA Basketball Manager 2026 — integrated career engine */
const $=s=>document.querySelector(s), clone=x=>JSON.parse(JSON.stringify(x));
const DB=window.SEED_DB;
const CAP=154.6,TAX=187.9,FLOOR=139.0;
let state=null, view="dashboard", saves=JSON.parse(localStorage.getItem("nbm_saves")||"{}"), chosen="BOS", toastTimer;
const fmt=n=>"$"+Number(n||0).toFixed(1)+"M", esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const teams=()=>state.teams, T=id=>state.teams.find(t=>t.abbr===id), P=id=>state.players.find(p=>p.id===id), roster=id=>state.players.filter(p=>p.team===id), capHit=id=>roster(id).reduce((s,p)=>s+p.salary,0);
const average=ps=>ps.length?ps.reduce((s,p)=>s+p.ovr,0)/ps.length:0;
function toast(s){let e=$("#toast");if(!e)return;e.textContent=s;e.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove("show"),2000)}
function makeSchedule(){
 const ids=teams().map(t=>t.abbr),arr=[...ids],rounds=[];
 for(let r=0;r<29;r++){let games=[];for(let i=0;i<15;i++){let a=arr[i],b=arr[29-i];if((r+i)%2)[a,b]=[b,a];games.push({id:`R${r+1}-${i+1}`,home:a,away:b,played:false});}rounds.push(games);arr.splice(1,0,arr.pop());}
 const first=clone(rounds),second=rounds.map((rd)=>rd.map(g=>({id:"B"+g.id,home:g.away,away:g.home,played:false})));
 const extras=[];for(let r=0;r<24;r++)extras.push(rounds[(r*7)%29].map((g,i)=>({id:`X${r+1}-${i+1}`,home:r%2?g.away:g.home,away:r%2?g.home:g.away,played:false})));
 return first.concat(second,extras);
}
function makeCareer(name,mode,teamId){
 let s={name,mode,season:2025,day:0,phase:"Regular Season",userTeam:teamId,teams:clone(DB.teams),players:clone(DB.players),freeAgents:[],schedule:[],history:[],transactions:[],awards:[],playoff:null,draftPool:[],settings:{injuries:true,tradeDifficulty:"Normal",salaryCap:CAP,luxuryTax:TAX},created:Date.now()};
 s.players.forEach(p=>{p.contractYears=2+Math.floor(Math.random()*3);p.stats={gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,fgm:0,fga:0,three:0,fta:0};p.role=p.pos==="PG"?"Playmaker":p.pos==="C"?"Rim Protector":"Starter";p.attributes={shooting:p.ovr+Math.round(Math.random()*6-3),defense:p.ovr+Math.round(Math.random()*6-3),playmaking:p.ovr+Math.round(Math.random()*6-3),rebounding:p.ovr+Math.round(Math.random()*6-3),athleticism:p.ovr+Math.round(Math.random()*6-3)};});
 s.freeAgents=[
 ["Russell Westbrook","PG",76,76,37,3],["Ben Simmons","PG",72,78,29,5],["Malcolm Brogdon","PG",77,77,33,8],["DeAndre Jordan","C",68,68,37,2],["Eric Gordon","SG",73,73,37,4],["Doug McDermott","SF",69,69,34,3],["Seth Curry","SG",72,72,35,3],["Robert Covington","PF",70,70,35,3],["Cedi Osman","SF",72,72,30,4],["Dario Saric","PF",71,71,31,5]
 ].map((x,i)=>({id:"FA-"+i,name:x[0],pos:x[1],ovr:x[2],pot:x[3],age:x[4],salary:x[5],team:null,contractYears:0,stats:{gp:0,pts:0,reb:0,ast:0}}));
 s.schedule=makeScheduleFor(s.teams);
 return s;
}
function makeScheduleFor(ts){
 const ids=ts.map(t=>t.abbr),arr=[...ids],rds=[];
 for(let r=0;r<29;r++){const g=[];for(let i=0;i<15;i++){let a=arr[i],b=arr[29-i];if((r+i)%2)[a,b]=[b,a];g.push({id:`${r+1}-${i+1}`,home:a,away:b,played:false});}rds.push(g);arr.splice(1,0,arr.pop());}
 const reverse=rds.map((rd,r)=>rd.map((g,i)=>({id:`${r+30}-${i+1}`,home:g.away,away:g.home,played:false})));
 const extra=[];for(let r=0;r<24;r++)extra.push(rds[(r*7)%29].map((g,i)=>({id:`${r+59}-${i+1}`,home:r%2?g.away:g.home,away:r%2?g.home:g.away,played:false})));
 return rds.concat(reverse,extra);
}
function save(silent=false){if(!state)return;saves[state.name]=clone(state);localStorage.setItem("nbm_saves",JSON.stringify(saves));if(!silent)toast("Career saved locally")}
function normalizePositions(players){
 const positionByName={"Jayson Tatum":"SF","Jaylen Brown":"SF","Derrick White":"PG","Jrue Holiday":"PG","Kristaps Porzingis":"C","Michael Porter Jr.":"SF","Nic Claxton":"C","Cam Thomas":"SG","D'Angelo Russell":"PG","Noah Clowney":"PF","Jalen Brunson":"PG","Karl-Anthony Towns":"C","Mikal Bridges":"SF","OG Anunoby":"SF","Josh Hart":"SF","Joel Embiid":"C","Tyrese Maxey":"PG","Paul George":"SF","Kelly Oubre Jr.":"SF","VJ Edgecombe":"SG","Scottie Barnes":"PF","Brandon Ingram":"SF","Immanuel Quickley":"PG","RJ Barrett":"SG","Jakob Poeltl":"C","Josh Giddey":"PG","Coby White":"SG","Nikola Vucevic":"C","Zach Collins":"PF","Matas Buzelis":"PF","Donovan Mitchell":"SG","Darius Garland":"PG","Evan Mobley":"PF","Jarrett Allen":"C","Max Strus":"SF","Cade Cunningham":"PG","Jalen Duren":"C","Ausar Thompson":"SF","Tobias Harris":"PF","Ron Holland":"SF","Tyrese Haliburton":"PG","Pascal Siakam":"PF","Myles Turner":"C","Andrew Nembhard":"PG","Bennedict Mathurin":"SG","Giannis Antetokounmpo":"PF","Damian Lillard":"PG","Khris Middleton":"SF","Brook Lopez":"C","Bobby Portis":"PF","Trae Young":"PG","Jalen Johnson":"PF","Dyson Daniels":"SG","Onyeka Okongwu":"C","LaMelo Ball":"PG","Brandon Miller":"SF","Miles Bridges":"PF","Mark Williams":"C","Kon Knueppel":"SG","Bam Adebayo":"C","Tyler Herro":"SG","Andrew Wiggins":"SF","Norman Powell":"SG","Kel'el Ware":"C","Paolo Banchero":"PF","Franz Wagner":"SF","Jalen Suggs":"SG","Desmond Bane":"SG","Wendell Carter Jr.":"C","Alex Sarr":"C","Jordan Poole":"SG","Bub Carrington":"PG","Kyshawn George":"SF","Bilal Coulibaly":"SF","Nikola Jokic":"C","Jamal Murray":"PG","Aaron Gordon":"PF","Christian Braun":"SG","Anthony Edwards":"SG","Julius Randle":"PF","Rudy Gobert":"C","Jaden McDaniels":"SF","Naz Reid":"C","Shai Gilgeous-Alexander":"PG","Jalen Williams":"SF","Chet Holmgren":"C","Isaiah Hartenstein":"C","Alex Caruso":"SG","Scoot Henderson":"PG","Shaedon Sharpe":"SG","Jerami Grant":"PF","Donovan Clingan":"C","Lauri Markkanen":"PF","Walker Kessler":"C","Keyonte George":"PG","Collin Sexton":"SG","Ace Bailey":"SF","Stephen Curry":"PG","Jimmy Butler":"SF","Draymond Green":"PF","Jonathan Kuminga":"PF","Brandin Podziemski":"PG","Kawhi Leonard":"SF","James Harden":"PG","Ivica Zubac":"C","Kris Dunn":"PG","LeBron James":"SF","Luka Doncic":"PG","Austin Reaves":"SG","Deandre Ayton":"C","Rui Hachimura":"PF","Devin Booker":"SG","Kevin Durant":"PF","Bradley Beal":"SG","Jusuf Nurkic":"C","Dillon Brooks":"SF","DeMar DeRozan":"SF","Domantas Sabonis":"C","Zach LaVine":"SG","Keegan Murray":"PF","Malik Monk":"PG","Anthony Davis":"C","Kyrie Irving":"PG","Klay Thompson":"SG","PJ Washington":"PF","Cooper Flagg":"SF","Alperen Sengun":"C","Amen Thompson":"SG","Jalen Green":"SG","Fred VanVleet":"PG","Ja Morant":"PG","Jaren Jackson Jr.":"PF","Zach Edey":"C","Santi Aldama":"PF","Zion Williamson":"PF","CJ McCollum":"SG","Trey Murphy III":"SF","Dejounte Murray":"PG","Victor Wembanyama":"C","De'Aaron Fox":"PG","Stephon Castle":"SG","Devin Vassell":"SG","Keldon Johnson":"SF"};
 (players||[]).forEach(p=>{if(positionByName[p.name])p.pos=positionByName[p.name]});
}
function load(name){state=clone(saves[name]);normalizePositions(state.players);normalizePositions(state.freeAgents);chosen=state.userTeam;view="dashboard";save(true);render()}
function fresh(){state=null;renderStart()}
function setView(v){view=v;render()}
function teamRating(id){const ps=roster(id).filter(p=>!p.injured).sort((a,b)=>b.ovr-a.ovr);return ps.slice(0,8).reduce((s,p)=>s+p.ovr*(1-p.fatigue/160),0)/Math.max(1,ps.slice(0,8).length)}
function simMatch(g,postseason=false){
 const h=T(g.home),a=T(g.away),hp=roster(h.abbr),ap=roster(a.abbr);
 const tacticBonus=t=>({Balanced:0,"Pace and Space":2,"Defensive Pressure":1.5,"Post Up":1,"Three-Point Focus":1.8,"Small Ball":1}[t.tactic]||0);
 const home=teamRating(h.abbr)+tacticBonus(h)+2.1,away=teamRating(a.abbr)+tacticBonus(a);
 const total=218+Math.random()*24+(home-away)*.45;
 let hScore=Math.max(72,Math.round(total/2+(home-away)*.75+(Math.random()-.5)*17)),aScore=Math.max(72,Math.round(total-hScore+(Math.random()-.5)*8));
 if(hScore===aScore)aScore++;
 const quartersH=[],quartersA=[];let remH=hScore,remA=aScore;
 for(let q=0;q<4;q++){let qh=q===3?remH:Math.max(12,Math.round(hScore/4+(Math.random()-.5)*7)),qa=q===3?remA:Math.max(12,Math.round(aScore/4+(Math.random()-.5)*7));quartersH.push(qh);quartersA.push(qa);remH-=qh;remA-=qa;}
 const win=hScore>aScore?h:a,lose=win===h?a:h;win.wins++;lose.losses++;
 const box=[];
 for(const p of hp.concat(ap)){
  let starter=roster(p.team).sort((x,y)=>y.ovr-x.ovr).slice(0,5).includes(p);
  let mins=p.injured?0:Math.max(0,Math.round((starter?29:13)+(p.ovr-75)*.32-p.fatigue*.2+(Math.random()*5-2)));
  const usage=(p.ovr/90)*(starter?1.15:.68),pts=mins?Math.max(0,Math.round(usage*(7+Math.random()*13))):0;
  const reb=mins?Math.max(0,Math.round((p.pos==="C"?5:2)+Math.random()*4+(p.attributes?.rebounding-75)*.05)):0;
  const ast=mins?Math.max(0,Math.round((p.pos==="PG"?4:1)+Math.random()*3+(p.attributes?.playmaking-75)*.05)):0;
  const stl=mins?+(Math.random()*1.8).toFixed(1):0,blk=mins?+(Math.random()*(p.pos==="C"?2:1)).toFixed(1):0,tov=mins?Math.max(0,Math.round(Math.random()*2)):0;
  const fga=mins?Math.max(1,Math.round(pts/(.38+Math.random()*.16))):0,fgm=mins?Math.min(fga,Math.round(fga*(.38+Math.random()*.18))):0;
  const three=Math.min(fgm,Math.round(Math.random()*Math.min(5,fga*.4))),fta=mins?Math.round(Math.random()*4):0;
  const st=p.stats||(p.stats={gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,fgm:0,fga:0,three:0,fta:0});
  st.gp++;st.pts+=pts;st.reb+=reb;st.ast+=ast;st.stl+=stl;st.blk+=blk;st.tov+=tov;st.fgm+=fgm;st.fga+=fga;st.three+=three;st.fta+=fta;
  p.fatigue=Math.min(45,p.fatigue+mins*.55);if(state.settings.injuries&&!p.injured&&Math.random()<.0012)p.injured=true;
  box.push({id:p.id,name:p.name,team:p.team,min:mins,pts,reb,ast,stl,blk,tov,fgm,fga});
 }
 const result={season:state.season,day:state.day+1,phase:postseason?"Playoffs":"Regular Season",home:g.home,away:g.away,homeScore:hScore,awayScore:aScore,qHome:quartersH,qAway:quartersA,box};
 state.history.unshift(result);g.played=true;g.result=result;return result;
}
function playDay(){if(state.phase!=="Regular Season"){toast("Regular season is over");return}let games=state.schedule[state.day];if(!games){finishRegularSeason();return}games.forEach(g=>simMatch(g));state.day++;state.players.forEach(p=>{p.fatigue=Math.max(0,p.fatigue-7);if(p.injured&&Math.random()<.09)p.injured=false});if(state.day>=82)finishRegularSeason();save(true);render();toast("Game day "+state.day+" simulated")}
function standings(conf){return state.teams.filter(t=>!conf||t.conf===conf).sort((a,b)=>b.wins-a.wins||(teamRating(b.abbr)-teamRating(a.abbr)))}
function finishRegularSeason(){state.phase="Play-In";state.playoff={east:standings("East").map(t=>t.abbr),west:standings("West").map(t=>t.abbr),round:0,series:[],champions:{}};state.awards=computeAwards();save(true)}
function computeAwards(){const players=state.players.filter(p=>p.stats?.gp).sort((a,b)=>(b.stats.pts/b.stats.gp)-(a.stats.pts/a.stats.gp));return [{name:"Most Valuable Player",winner:players[0]?.name||"TBD"},{name:"Scoring Leader",winner:players[0]?.name||"TBD"},{name:"Defensive Player of the Year",winner:state.players.slice().sort((a,b)=>(b.attributes?.defense||0)-(a.attributes?.defense||0))[0]?.name||"TBD"},{name:"Most Improved Player",winner:state.players.slice().sort((a,b)=>b.pot-b.ovr)[0]?.name||"TBD"}]}
function simulatePlayIn(){
 if(state.phase!=="Play-In")return;
 let qualifiers=[];
 for(const conf of ["east","west"]){
  let s=state.playoff[conf];
  const game=(a,b,label)=>{let win=Math.random()<(.5+(teamRating(a)-teamRating(b))*.012)?a:b;state.history.unshift({season:state.season,phase:"Play-In",home:a,away:b,homeScore:win===a?112:103,awayScore:win===b?112:103,box:[]});return win};
  const seven=game(s[6],s[7],"7/8"),loserSeven=seven===s[6]?s[7]:s[6];
  const winnerNine=game(s[8],s[9],"9/10");
  const finalEight=game(loserSeven,winnerNine,"8 seed");
  qualifiers.push(...s.slice(0,6),seven,finalEight);
 }
 state.playoff.brackets={round:0,east:qualifiers.slice(0,8),west:qualifiers.slice(8,16),series:{}};
 state.phase="Playoffs";save();render();toast("Play-In complete. Best-of-seven playoffs begin")
}
function playoffStep(){
 if(state.phase!=="Playoffs")return;
 const b=state.playoff.brackets,round=b.round;
 if(round<=2){
  let conferences=[["east",b.east],["west",b.west]],completed=true;
  for(const [conf,list] of conferences){
   const winners=[];
   for(let i=0;i<list.length;i+=2){
    const a=list[i],bb=list[i+1],key=`${round}-${conf}-${i/2}`;
    let s=b.series[key]||{a,b:bb,wa:0,wb:0,games:0};
    if(s.wa<4&&s.wb<4){
      const win=Math.random()<(.5+(teamRating(a)-teamRating(bb))*.012)?a:bb;
      s.games++;if(win===a)s.wa++;else s.wb++;
      const home=s.games%2===1?a:bb;
      state.history.unshift({season:state.season,phase:"Playoffs",home,away:home===a?bb:a,homeScore:win===home?114:102,awayScore:win===home?102:114,box:[]});
      b.series[key]=s;
    }
    if(s.wa>=4)winners.push(a);else if(s.wb>=4)winners.push(bb);else {winners.push(null);completed=false}
   }
   b[conf+"Winners"]=winners;
  }
  if(completed){
   b.east=b.eastWinners.filter(Boolean);b.west=b.westWinners.filter(Boolean);b.round++;
   if(round===2)b.conferenceFinalists=[b.east[0],b.west[0]];
  }
 }else{
  const [a,bb]=b.conferenceFinalists,key="finals";
  let s=b.series[key]||{a,b:bb,wa:0,wb:0,games:0};
  if(s.wa<4&&s.wb<4){
   const win=Math.random()<(.5+(teamRating(a)-teamRating(bb))*.012)?a:bb;
   s.games++;if(win===a)s.wa++;else s.wb++;
   const home=s.games%2===1?a:bb;
   state.history.unshift({season:state.season,phase:"NBA Finals",home,away:home===a?bb:a,homeScore:win===home?116:104,awayScore:win===home?104:116,box:[]});
   b.series[key]=s;
  }
  if(s.wa>=4||s.wb>=4){
   state.champion=s.wa>=4?a:bb;state.phase="Offseason";
   state.awards.unshift({name:"NBA Champion",winner:state.champion});
   state.teams.find(t=>t.abbr===state.champion).championships=(state.teams.find(t=>t.abbr===state.champion).championships||0)+1;
  }
 }
 save();render();toast(state.champion?state.champion+" win the NBA Finals!":"Playoff game simulated")
}
function capStatus(id){let p=capHit(id);return {payroll:p,over:p-CAP,tax:p>TAX,room:CAP-p}}
function trade(){
 let from=$("#tradeFrom").value,to=$("#tradeTo").value,p=P($("#tradePlayer").value),q=P($("#tradeReceive").value);
 if(!p||!q||p.team!==from||q.team!==to||from===to)return toast("Choose valid players from two different teams");
 if(state.settings.tradeDifficulty==="Strict"&&Math.abs(p.salary-q.salary)>Math.max(5,p.salary*.25))return toast("Trade rejected: salary matching rules");
 p.team=to;q.team=from;T(from).players=roster(from).map(x=>x.id);T(to).players=roster(to).map(x=>x.id);
 state.transactions.unshift(`${p.name} (${from}) for ${q.name} (${to})`);save();render();toast("Trade completed")}
function signFreeAgent(){let id=$("#freeAgent").value,t=$("#faTeam").value,p=state.freeAgents.find(x=>x.id===id);if(!p)return;let salary=+$("#faSalary").value||p.salary,years=+$("#faYears").value||1;if(capHit(t)+salary>CAP+35&&state.mode!=="sandbox")return toast("Offer exceeds the available payroll limit");let np={...p,id:"FA-SIGNED-"+Date.now(),team:t,salary,contractYears:years,injured:false,fatigue:0,gp:0,ppg:0,rpg:0,apg:0,stats:{gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,fgm:0,fga:0,three:0,fta:0},attributes:{shooting:p.ovr,defense:p.ovr,playmaking:p.ovr,rebounding:p.ovr,athleticism:p.ovr}};state.players.push(np);state.freeAgents=state.freeAgents.filter(x=>x.id!==id);state.transactions.unshift(`${p.name} signed by ${t} for ${fmt(salary)} × ${years} years`);save();render();toast("Free agent signed")}
function releasePlayer(){let p=P($("#releasePlayer").value);if(!p)return;p.team=null;state.freeAgents.push({...p,id:"FA-"+p.id});state.players=state.players.filter(x=>x.id!==p.id);state.transactions.unshift(`${p.name} waived by ${state.userTeam}`);save();render()}
function editPlayer(){let p=P($("#editPlayer").value);if(!p)return;for(const k of ["ovr","pot","age","salary"])p[k]=+$("#e"+k).value;p.ovr=Math.max(40,Math.min(99,p.ovr));p.pot=Math.max(40,Math.min(99,p.pot));p.salary=Math.max(0,p.salary);save();render();toast("Player edited")}
function setTactic(){T(state.userTeam).tactic=$("#tactic").value;save();render();toast("Tactics updated")}
function setLineup(){let ids=[...document.querySelectorAll("[data-starter]")].filter(x=>x.checked).map(x=>x.dataset.starter);T(state.userTeam).starters=ids;save();toast("Starting five saved")}
function aiOffseason(){
 state.teams.filter(t=>t.abbr!==state.userTeam).forEach(t=>{let rs=roster(t.abbr);rs.forEach(p=>{if(p.contractYears===0&&state.freeAgents.length>0&&rs.length>5){p.team=null;state.freeAgents.push({...p,id:"FA-"+p.id});state.players=state.players.filter(x=>x.id!==p.id)}});while(roster(t.abbr).length<8&&state.freeAgents.length){let p=state.freeAgents.sort((a,b)=>b.ovr-a.ovr).shift();state.players.push({...p,id:"AI-"+t.abbr+"-"+Date.now()+"-"+Math.random(),team:t.abbr,contractYears:2})}});
 state.players.forEach(p=>{if(p.contractYears>0)p.contractYears--;if(p.age<25)p.ovr=Math.min(p.pot,p.ovr+(Math.random()<.65?1:0));else if(p.age>31)p.ovr=Math.max(50,p.ovr-(Math.random()<.45?1:0));p.fatigue=0;p.injured=false;p.stats={gp:0,pts:0,reb:0,ast:0,stl:0,blk:0,tov:0,fgm:0,fga:0,three:0,fta:0}});
}
function nextSeason(){if(state.phase!=="Offseason")return toast("Complete the season before advancing");aiOffseason();state.teams.forEach(t=>{t.wins=0;t.losses=0});state.season++;state.day=0;state.phase="Regular Season";state.schedule=makeScheduleFor(state.teams);state.playoff=null;state.champion=null;save();render();toast("Welcome to "+state.season+"-"+String(state.season+1).slice(-2))}
function exportSave(){const blob=new Blob([JSON.stringify(state)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(state.name.replace(/[^a-z0-9]/gi,"_")||"nba_career")+".json";a.click();URL.revokeObjectURL(a.href)}
function importSave(file){const r=new FileReader();r.onload=()=>{try{let s=JSON.parse(r.result);if(!s.teams||!s.players||!s.schedule)throw 0;saves[s.name]=s;localStorage.setItem("nbm_saves",JSON.stringify(saves));toast("Save imported");renderStart()}catch(e){toast("Invalid save file")}};r.readAsText(file)}
function playerStats(p){let s=p.stats||{},g=s.gp||0;return {ppg:g?(s.pts/g).toFixed(1):"—",rpg:g?(s.reb/g).toFixed(1):"—",apg:g?(s.ast/g).toFixed(1):"—",fg:g?(100*s.fgm/Math.max(1,s.fga)).toFixed(1)+"%":"—"}}
function extendContract(){
 const p=P($("#extendPlayer").value);if(!p)return;
 const offer=Math.max(0,+$("#extendSalary").value||0),years=Math.max(1,Math.min(5,+$("#extendYears").value||1));
 const expected=p.salary*(p.age<27?1.12:p.age>32?.9:1.04);
 if(offer<expected*.88){toast("Negotiation rejected: offer is below the player's expectation");return}
 if(capHit(p.team)+offer-p.salary>CAP+35&&state.mode!=="sandbox"){toast("Extension would exceed the payroll limit");return}
 p.salary=offer;p.contractYears=years;state.transactions.unshift(`${p.name} re-signed with ${p.team}: ${fmt(offer)} × ${years} years`);
 save();render();toast("Contract extension agreed")
}
function showPlayer(id){
 const p=P(id);if(!p)return;const st=playerStats(p),a=p.attributes||{};
 const old=$("#profileModal");if(old)old.remove();
 const modal=document.createElement("div");modal.id="profileModal";modal.className="modal";
 modal.innerHTML=`<div class="modalcard"><button class="close" id="closeProfile">✕</button><span class="eyebrow">PLAYER PROFILE</span><h2>${esc(p.name)}</h2><p class="muted">${p.team||"Free Agent"} · ${p.pos} · Age ${p.age}</p><div class="profile-rating"><strong>${p.ovr}</strong><span>OVERALL</span><strong>${p.pot}</strong><span>POTENTIAL</span></div><div class="profilegrid">${Object.entries(a).map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div><h3>Season statistics</h3><div class="profilegrid"><div><span>PPG</span><b>${st.ppg}</b></div><div><span>RPG</span><b>${st.rpg}</b></div><div><span>APG</span><b>${st.apg}</b></div><div><span>FG%</span><b>${st.fg}</b></div></div><p class="muted">Contract: ${fmt(p.salary)} per season · ${p.contractYears||0} years remaining · Fatigue ${Math.round(p.fatigue||0)}% · ${p.injured?"Injured":"Available"}</p></div>`;
 document.body.appendChild(modal);$("#closeProfile").onclick=()=>modal.remove();modal.addEventListener("click",e=>{if(e.target===modal)modal.remove()})
}
function renderStart(){
 $("#app").innerHTML=`<div class="start"><div class="startlogo">🏀</div><span class="eyebrow">FRONT OFFICE SIMULATION</span><h1>NBA Basketball<br><i>Manager 2026</i></h1><p>Build a contender. Run the league. Create your basketball legacy.</p><section class="panel startpanel"><h2>New career</h2><input id="careerName" placeholder="Career name" maxlength="32"><select id="careerMode"><option value="career">Franchise career</option><option value="sandbox">Sandbox / Commissioner</option></select><label>Choose franchise</label><select id="startTeam">${DB.teams.map(t=>`<option value="${t.abbr}">${t.name}</option>`).join("")}</select><button class="primary" id="newCareer">Start career</button></section>${Object.keys(saves).length?`<section class="panel startpanel"><h2>Saved careers</h2>${Object.keys(saves).map(n=>`<div class="saveitem"><span>${esc(n)}<small>${saves[n].season} · ${saves[n].phase}</small></span><button data-load="${esc(n)}">Load</button><button data-del="${esc(n)}" class="danger">Delete</button></div>`).join("")}</section>`:""}<section class="panel startpanel"><h2>Import career</h2><input type="file" id="importFile" accept=".json,application/json"></section></div>`;
 $("#newCareer").onclick=()=>{let n=$("#careerName").value.trim()||"My NBA Career";if(saves[n])return toast("Save name already exists");state=makeCareer(n,$("#careerMode").value,$("#startTeam").value);save(true);view="dashboard";render()};
 document.querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>load(b.dataset.load));document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{delete saves[b.dataset.del];localStorage.setItem("nbm_saves",JSON.stringify(saves));renderStart()});$("#importFile").onchange=e=>e.target.files[0]&&importSave(e.target.files[0]);
}
function rows(ps){return ps.map(p=>{let st=playerStats(p);return `<div class="playerrow clickable" data-player="${p.id}"><b>${esc(p.name)}${p.injured?' <em>INJ</em>':''}</b><span>${p.pos}</span><strong>${p.ovr}</strong><span>${p.age}</span><span>${st.ppg}</span><span>${fmt(p.salary)} · ${p.contractYears||0}y</span></div>`}).join("")}
function gameRow(g){return `<div class="game-row"><span>${g.phase||"Regular"}</span><b>${g.away} @ ${g.home}</b><strong>${g.awayScore??"—"} – ${g.homeScore??"—"}</strong></div>`}
function page(){
 let t=T(state.userTeam),rs=roster(t.abbr),played=state.schedule.flat().filter(g=>g.played).length;
 if(view==="dashboard")return `<div class="hero" style="--team:${t.color}"><div><span class="eyebrow">FRANCHISE CONTROL</span><h1>${t.name}</h1><p>${state.season}-${String(state.season+1).slice(-2)} · ${state.phase}</p><button class="primary" id="advance">${state.phase==="Regular Season"?"Simulate next game day":state.phase==="Play-In"?"Simulate Play-In":state.phase==="Playoffs"?"Simulate playoff game":"Start next season"}</button></div><div class="record"><strong>${t.wins}-${t.losses}</strong><small>WIN–LOSS RECORD</small></div></div><div class="stats"><div class="stat"><small>League day</small><b>${state.day}/82</b></div><div class="stat"><small>League games</small><b>${played}/1230</b></div><div class="stat"><small>Team rating</small><b>${teamRating(t.abbr).toFixed(1)}</b></div><div class="stat"><small>Payroll / cap</small><b>${fmt(capHit(t.abbr))}</b></div></div><section class="panel"><div class="panelhead"><h2>Team identity</h2><select id="tactic">${["Balanced","Pace and Space","Defensive Pressure","Post Up","Three-Point Focus","Small Ball"].map(x=>`<option ${t.tactic===x?"selected":""}>${x}</option>`).join("")}</select></div><p class="muted">Tactics affect team performance in every simulated game. Current roster size: ${rs.length}.</p></section><section class="panel"><h2>Roster leaders</h2><div class="playerhead"><span>PLAYER</span><span>POS</span><span>OVR</span><span>AGE</span><span>PPG</span><span>CONTRACT</span></div>${rows(rs.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,8))}</section><section class="panel"><h2>Latest results</h2>${state.history.slice(0,5).map(gameRow).join("")||'<p class="muted">No games simulated yet.</p>'}</section>`;
 if(view==="roster")return `<div class="pagehead"><div><span class="eyebrow">PLAYER PERSONNEL</span><h1>Roster & rotation</h1><p>Set starters, inspect player stats, contracts and health.</p></div><select id="rosterTeam">${teams().map(x=>`<option value="${x.abbr}" ${chosen===x.abbr?"selected":""}>${x.name}</option>`).join("")}</select></div><section class="panel"><h2>${T(chosen).name} · ${roster(chosen).length} players</h2><div class="playerhead"><span>PLAYER</span><span>POS</span><span>OVR</span><span>AGE</span><span>PPG</span><span>CONTRACT</span></div>${rows(roster(chosen).sort((a,b)=>b.ovr-a.ovr))}</section><section class="panel"><h2>Starting five · ${T(chosen).name}</h2>${roster(chosen).sort((a,b)=>b.ovr-a.ovr).map(p=>`<label class="starter"><input type="checkbox" data-starter="${p.id}" ${(T(chosen).starters||roster(chosen).sort((a,b)=>b.ovr-a.ovr).slice(0,5).map(x=>x.id)).includes(p.id)?"checked":""}> ${esc(p.name)} · ${p.pos} · ${p.ovr} OVR</label>`).join("")}<button class="secondary" id="lineupSave">Save starting five</button></section>`;
 if(view==="league")return `<div class="pagehead"><div><span class="eyebrow">LEAGUE OFFICE</span><h1>Standings</h1><p>Conference rankings and playoff race</p></div></div><div class="columns">${["East","West"].map(c=>`<section class="panel"><h2>${c}ern Conference</h2>${standings(c).map((x,i)=>`<div class="standing"><b>${i+1}</b><span>${x.name}</span><strong>${x.wins}-${x.losses}</strong><small>${teamRating(x.abbr).toFixed(1)} OVR</small></div>`).join("")}</section>`).join("")}</div>`;
 if(view==="schedule")return `<div class="pagehead"><div><span class="eyebrow">REGULAR SEASON</span><h1>Schedule</h1><p>${played} of 1,230 fixtures played · Day ${state.day}/82</p></div></div><section class="panel">${state.schedule.slice(Math.max(0,state.day-2),Math.min(82,state.day+10)).map((rd,i)=>`<h3>Game day ${Math.max(0,state.day-2)+i+1}</h3>${rd.map(g=>`<div class="game-row"><span>${g.id}</span><b>${g.away} @ ${g.home}</b><strong>${g.played?g.result.awayScore+"–"+g.result.homeScore:"Upcoming"}</strong></div>`).join("")}`).join("")}</section>`;
 if(view==="match")return `<div class="pagehead"><div><span class="eyebrow">GAME NIGHT</span><h1>Match centre</h1><p>Simulate a full 15-game league night with quarter scores and player box scores.</p></div></div><section class="panel"><h2>${state.phase}</h2><p class="muted">${state.phase==="Regular Season"?"82 game days · 1,230 fixtures":state.phase==="Play-In"?"Top 10 in each conference compete for seeds 7 and 8":state.phase==="Playoffs"?"Best-of-seven playoff series":"Season completed"}</p><button class="primary" id="advance">Advance competition</button></section>${state.history[0]?`<section class="panel"><h2>Latest box score · ${state.history[0].away} at ${state.history[0].home}</h2><h3>${state.history[0].awayScore} – ${state.history[0].homeScore}</h3><div class="quarter">Q1 ${state.history[0].qAway?.[0]??"—"}–${state.history[0].qHome?.[0]??"—"} · Q2 ${state.history[0].qAway?.[1]??"—"}–${state.history[0].qHome?.[1]??"—"} · Q3 ${state.history[0].qAway?.[2]??"—"}–${state.history[0].qHome?.[2]??"—"} · Q4 ${state.history[0].qAway?.[3]??"—"}–${state.history[0].qHome?.[3]??"—"}</div><div class="playerhead"><span>PLAYER</span><span>TEAM</span><span>MIN</span><span>PTS</span><span>REB</span><span>AST</span></div>${(state.history[0].box||[]).sort((a,b)=>b.pts-a.pts).map(p=>`<div class="playerrow"><b>${esc(p.name)}</b><span>${p.team}</span><span>${p.min}</span><strong>${p.pts}</strong><span>${p.reb}</span><span>${p.ast}</span></div>`).join("")}</section>`:""}`;
 if(view==="trade")return `<div class="pagehead"><div><span class="eyebrow">FRONT OFFICE</span><h1>Trade & free agency</h1><p>Player-for-player trades and free-agent contracts.</p></div></div><section class="panel tradeform"><label>Team A<select id="tradeFrom">${teams().map(x=>`<option value="${x.abbr}" ${x.abbr===state.userTeam?"selected":""}>${x.name}</option>`).join("")}</select></label><label>Player sent<select id="tradePlayer"></select></label><label>Team B<select id="tradeTo">${teams().filter(x=>x.abbr!==state.userTeam).map(x=>`<option value="${x.abbr}">${x.name}</option>`).join("")}</select></label><label>Player received<select id="tradeReceive"></select></label><button class="primary" id="tradeBtn">Complete trade</button></section><section class="panel tradeform"><label>Filter free agents by position<select id="faPosition"><option value="ALL">All positions</option>${["PG","SG","SF","PF","C"].map(pos=>`<option value="${pos}">${pos}</option>`).join("")}</select></label><label>Free agent<select id="freeAgent">${state.freeAgents.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.pos} · ${p.ovr} OVR · ${fmt(p.salary)}</option>`).join("")}</select></label><label>Sign to<select id="faTeam">${teams().map(x=>`<option value="${x.abbr}" ${x.abbr===state.userTeam?"selected":""}>${x.name}</option>`).join("")}</select></label><label>Annual salary ($M)<input id="faSalary" type="number" step=".1" value="5"></label><label>Years<input id="faYears" type="number" min="1" max="5" value="2"></label><button class="primary" id="signFA">Negotiate & sign</button></section><section class="panel tradeform"><label>Player to extend<select id="extendPlayer">${roster(state.userTeam).map(p=>`<option value="${p.id}">${esc(p.name)} · ${fmt(p.salary)} · ${p.contractYears||0}y</option>`).join("")}</select></label><label>Annual salary offer ($M)<input id="extendSalary" type="number" step=".1" value="20"></label><label>Contract length (years)<input id="extendYears" type="number" min="1" max="5" value="3"></label><button class="primary" id="extendBtn">Negotiate extension</button></section><section class="panel"><h2>Transactions</h2>${state.transactions.slice(0,30).map(x=>`<p class="game-row">${esc(x)}</p>`).join("")||'<p class="muted">No transactions yet.</p>'}</section>`;
 if(view==="finances")return `<div class="pagehead"><div><span class="eyebrow">BUSINESS OPERATIONS</span><h1>Salary cap & finances</h1><p>Team payroll, cap room and luxury tax estimate.</p></div></div><div class="stats"><div class="stat"><small>Payroll</small><b>${fmt(capHit(t.abbr))}</b></div><div class="stat"><small>Cap room</small><b>${fmt(Math.max(0,CAP-capHit(t.abbr)))}</b></div><div class="stat"><small>Luxury tax line</small><b>${fmt(TAX)}</b></div><div class="stat"><small>Tax status</small><b>${capHit(t.abbr)>TAX?"Taxpayer":capHit(t.abbr)>CAP?"Over cap":"Under cap"}</b></div></div><section class="panel"><h2>Contract book</h2>${rows(rs)}<p class="muted">Current payroll: ${fmt(capHit(t.abbr))}. Reference cap: ${fmt(CAP)}. Tax line: ${fmt(TAX)}. The CBA is represented by a simplified cap/tax model, not every exception and apron rule.</p></section>`;
 if(view==="sandbox")return `<div class="pagehead"><div><span class="eyebrow">COMMISSIONER MODE</span><h1>League editor</h1><p>Edit players, salaries, franchises and financial constraints.</p></div></div><section class="panel tradeform"><label>Player<select id="editPlayer">${state.players.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.team}</option>`).join("")}</select></label><label>Overall<input id="eovr" type="number" min="40" max="99" value="85"></label><label>Potential<input id="epot" type="number" min="40" max="99" value="90"></label><label>Age<input id="eage" type="number" min="18" max="50" value="25"></label><label>Salary ($M)<input id="esalary" type="number" min="0" step=".1" value="20"></label><button class="primary" id="editBtn">Apply player edit</button><label>Control franchise<select id="controlTeam">${teams().map(x=>`<option value="${x.abbr}" ${x.abbr===state.userTeam?"selected":""}>${x.name}</option>`).join("")}</select></label><button class="secondary" id="controlBtn">Take control</button><button class="secondary" id="moneyBtn">Unlimited team funds</button><label>Injury system<select id="injuryToggle"><option value="true" ${state.settings.injuries?"selected":""}>Enabled</option><option value="false" ${!state.settings.injuries?"selected":""}>Disabled</option></select></label><label>Trade difficulty<select id="difficulty"><option>Normal</option><option ${state.settings.tradeDifficulty==="Strict"?"selected":""}>Strict</option></select></label><button class="secondary" id="settingsBtn">Apply league settings</button></section>`;
 if(view==="history")return `<div class="pagehead"><div><span class="eyebrow">LEAGUE ARCHIVE</span><h1>Records & awards</h1><p>Season awards and match archive</p></div></div><section class="panel"><h2>Awards</h2>${state.awards.map(a=>`<div class="standing"><b>🏆</b><span>${a.name}</span><strong>${esc(a.winner)}</strong></div>`).join("")||'<p class="muted">Awards are generated at the end of the regular season.</p>'}</section><section class="panel"><h2>Match history</h2>${state.history.slice(0,100).map(gameRow).join("")}</section><section class="panel"><h2>Career archive</h2><p>Champion: <b>${state.champion||"Season in progress"}</b> · Seasons completed: ${state.season-2025+(state.phase==="Offseason"?1:0)}</p><button class="secondary" id="exportBtn">Export career save</button></section>`;
 return "";
}
function render(){
 if(!state)return renderStart();
 $("#app").innerHTML=`<header class="top"><div class="brand"><span class="ball">🏀</span><div><b>NBA MANAGER</b><small>2025–26 · ${state.phase}</small></div></div><div class="topright"><span class="season">${state.season}-${String(state.season+1).slice(-2)}</span><button class="ghost" id="saveBtn">Save</button><button class="ghost" id="exportTop">Export</button></div></header><div class="shell"><aside class="side">${[["dashboard","Overview"],["roster","Roster & rotation"],["league","Standings"],["schedule","Schedule"],["match","Match centre"],["trade","Trade / free agency"],["finances","Salary cap"],["sandbox","Commissioner"],["history","History / awards"]].map(([v,l])=>`<button data-nav="${v}" class="${view===v?"active":""}">${l}</button>`).join("")}<div class="sidebottom"><small>Managing</small><b>${T(state.userTeam).name}</b><button id="switchSave" class="ghost">Change / load save</button></div></aside><main id="content">${page()}</main></div><div id="toast"></div>`;
 document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>setView(b.dataset.nav));
 document.querySelectorAll("[data-player]").forEach(b=>b.onclick=()=>showPlayer(b.dataset.player));
 $("#saveBtn").onclick=()=>save();$("#exportTop").onclick=exportSave;$("#switchSave").onclick=renderStart;
 $("#advance")?.addEventListener("click",()=>{if(state.phase==="Regular Season")playDay();else if(state.phase==="Play-In")simulatePlayIn();else if(state.phase==="Playoffs")playoffStep();else nextSeason()});
 $("#tactic")?.addEventListener("change",setTactic);$("#rosterTeam")?.addEventListener("change",e=>{chosen=e.target.value;render()});$("#lineupSave")?.addEventListener("click",setLineup);
 $("#tradeFrom")?.addEventListener("change",fillTrade);$("#tradeTo")?.addEventListener("change",fillTrade);$("#tradeBtn")?.addEventListener("click",trade);fillTrade();
 $("#faPosition")?.addEventListener("change",filterFreeAgents);$("#signFA")?.addEventListener("click",signFreeAgent);$("#extendBtn")?.addEventListener("click",extendContract);$("#extendPlayer")?.addEventListener("change",()=>{let p=P($("#extendPlayer").value);if(p)$("#extendSalary").value=p.salary});$("#editBtn")?.addEventListener("click",editPlayer);$("#controlBtn")?.addEventListener("click",()=>{state.userTeam=$("#controlTeam").value;save();render()});$("#moneyBtn")?.addEventListener("click",()=>{T(state.userTeam).cash=999999;state.mode="sandbox";save();toast("Unlimited funds enabled")});
 $("#settingsBtn")?.addEventListener("click",()=>{state.settings.injuries=$("#injuryToggle").value==="true";state.settings.tradeDifficulty=$("#difficulty").value;save();toast("League settings saved")});$("#exportBtn")?.addEventListener("click",exportSave);
 $("#editPlayer")?.addEventListener("change",()=>{let p=P($("#editPlayer").value);if(p){$("#eovr").value=p.ovr;$("#epot").value=p.pot;$("#eage").value=p.age;$("#esalary").value=p.salary}});
}
function fillTrade(){let f=$("#tradeFrom"),to=$("#tradeTo");if(!f||!to)return;let a=roster(f.value),b=roster(to.value);$("#tradePlayer").innerHTML=a.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.pos} · ${p.ovr} OVR</option>`).join("");$("#tradeReceive").innerHTML=b.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.pos} · ${p.ovr} OVR</option>`).join("")}
function filterFreeAgents(){const sel=$("#faPosition"),list=$("#freeAgent");if(!sel||!list)return;const wanted=sel.value,available=state.freeAgents.filter(p=>wanted==="ALL"||p.pos===wanted);list.innerHTML=available.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.pos} · ${p.ovr} OVR · ${fmt(p.salary)}</option>`).join("");if(!available.length)list.innerHTML='<option value="">No free agents at this position</option>'}
function boot(){renderStart()}
boot();
