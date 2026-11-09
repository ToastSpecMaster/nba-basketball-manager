const fs=require("fs"),path=require("path");
const db=JSON.parse(fs.readFileSync(path.join(__dirname,"database.json"),"utf8"));
const assert=(v,m)=>{if(!v)throw new Error(m)};
assert(db.teams.length===30,"30 teams");
assert(new Set(db.teams.map(t=>t.abbr)).size===30,"Unique team abbreviations");
assert(db.teams.filter(t=>t.conf==="East").length===15,"15 Eastern teams");
assert(db.teams.filter(t=>t.conf==="West").length===15,"15 Western teams");
assert(db.players.length===150,"150 featured seed player records");
const ids=db.teams.map(t=>t.abbr),arr=[...ids],rounds=[];
for(let r=0;r<29;r++){
 const games=[];
 for(let i=0;i<15;i++){let home=arr[i],away=arr[29-i];if((r+i)%2)[home,away]=[away,home];games.push({home,away});}
 rounds.push(games);arr.splice(1,0,arr.pop());
}
const reverse=rounds.map(rd=>rd.map(g=>({home:g.away,away:g.home})));
const extras=[];
for(let r=0;r<24;r++)extras.push(rounds[(r*7)%29].map(g=>({home:r%2?g.away:g.home,away:r%2?g.home:g.away})));
const schedule=rounds.concat(reverse,extras);
assert(schedule.length===82,"82 game days");
assert(schedule.flat().length===1230,"1,230 fixtures");
const counts=Object.fromEntries(ids.map(id=>[id,0]));
for(const [i,rd] of schedule.entries()){
 const seen=new Set();
 for(const g of rd){assert(!seen.has(g.home)&&!seen.has(g.away),`Duplicate team on day ${i+1}`);seen.add(g.home);seen.add(g.away);counts[g.home]++;counts[g.away]++;}
 assert(seen.size===30,`Every team must play each game day ${i+1}`);
}
for(const id of ids)assert(counts[id]===82,`${id} must play 82 games`);
console.log("PASS — 30 franchises, 15 per conference, 82 rounds, 1,230 fixtures, every team plays exactly 82 games.");
console.log("LIMITATION — seed database currently has 150 featured player records (five per team), not complete official opening-night rosters.");
