// Builds data/compline.json: Night Prayer (Compline) assembled ONLY from public-domain / site-licensed texts.
// Psalms, short reading, responsory and Nunc dimittis come from the site's own CPDV files (bible/cpdv); the hymn is J. M. Neale's
// 1851 translation of "Te lucis ante terminum"; the Confiteor, antiphon and prayers are traditional breviary texts (pre-1970 Roman rite).
// The modern ICEL / Liturgy of the Hours texts are copyrighted and are NOT used. Usage: node tools/gen_compline.js
const fs=require("fs"),path=require("path"),R=path.join(__dirname,".."),V=(b,c)=>JSON.parse(fs.readFileSync(path.join(R,"bible/cpdv",b+".json"))).chapters[c-1];
const C=JSON.parse(fs.readFileSync(path.join(R,"data/content.json")));
const verses=(b,c,from,to,strip)=>{const v=V(b,c).slice(from-1,to).map(x=>x.replace(/ Pause$/,""));if(strip)v[0]=v[0].replace(strip,"");return v.join(" ")};
const psalm=(n,from,strip)=>V("psa",n).slice(from-1).map((x,i)=>(i===0&&strip?x.replace(strip,""):x).replace(/ Pause$/," \u2014")).join("\n");
const glory="Glory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.";
const D={title:"Night Prayer (Compline)",
 note:"Assembled from public-domain texts in the same translation as the rest of this site: the Psalms, reading and canticle are the Catholic Public Domain Version (CPDV) of the Latin Vulgate (psalm numbers are the Vulgate's: 4, 90 and 133 are 4, 91 and 134 in modern Bibles). The hymn is by J. M. Neale (1851); the other prayers are traditional breviary texts. The modern Liturgy of the Hours is copyrighted, so for the current official text use the Universalis link below.",
 sections:[
 {h:"Opening",t:"V. O God, come to my assistance.\nR. O Lord, make haste to help me.\n\n"+glory},
 {h:"Examination of conscience",t:"Take a quiet moment to look back over the day: where did I love, and where did I fail to love?\n\nI confess to almighty God, to blessed Mary ever Virgin, to blessed Michael the Archangel, to blessed John the Baptist, to the holy Apostles Peter and Paul, to all the saints, that I have sinned exceedingly in thought, word and deed, through my fault, through my fault, through my most grievous fault. Therefore I beseech blessed Mary ever Virgin, blessed Michael the Archangel, blessed John the Baptist, the holy Apostles Peter and Paul, and all the saints, to pray to the Lord our God for me.\n\nMay almighty God have mercy on us, forgive us our sins, and bring us to everlasting life. Amen."},
 {h:"Hymn \u00b7 Te lucis ante terminum",t:"Before the ending of the day,\nCreator of the world, we pray\nThat, with thy wonted favour, thou\nWouldst be our guard and keeper now.\n\nFrom all ill dreams defend our eyes,\nFrom nightly fears and fantasies;\nTread under foot our ghostly foe,\nThat no pollution we may know.\n\nO Father, that we ask be done\nThrough Jesus Christ, thine only Son;\nWho, with the Holy Ghost and thee,\nDoth live and reign eternally. Amen.",src:"Translation: J. M. Neale, 1851 (public domain)"},
 {h:"Psalm 4 (Vulgate 4)",t:psalm(4,2)+"\n\n"+glory,src:"CPDV, Psalm 4:2\u201310"},
 {h:"Psalm 90 (modern 91)",t:psalm(90,1,/^The Praise of a Canticle, of David\. /)+"\n\n"+glory,src:"CPDV, Psalm 90"},
 {h:"Psalm 133 (modern 134)",t:psalm(133,1,/^A Canticle in steps\. /)+"\n\n"+glory,src:"CPDV, Psalm 133"},
 {h:"Short Reading \u00b7 1 Peter 5:8\u20139",t:verses("1pe",5,8,9)+"\n\nR. Thanks be to God.",src:"CPDV, 1 Peter 5:8\u20139"},
 {h:"Responsory",t:"V. Into your hands, O Lord, I commend my spirit.\nR. Into your hands, O Lord, I commend my spirit.\nV. You have redeemed us, O Lord, God of truth.\nR. I commend my spirit.\nV. Glory be to the Father, and to the Son, and to the Holy Spirit.\nR. Into your hands, O Lord, I commend my spirit.",src:"after Psalm 30:6 (CPDV)"},
 {h:"Canticle of Simeon (Nunc dimittis)",t:"Antiphon: Save us, O Lord, while waking, and keep us while sleeping, that we may watch with Christ, and rest in peace.\n\n"+verses("luk",2,29,32).replace(/[\u201c\u201d]/g,"")+"\n\n"+glory+"\n\nAntiphon: Save us, O Lord, while waking, and keep us while sleeping, that we may watch with Christ, and rest in peace.",src:"CPDV, Luke 2:29\u201332"},
 {h:"Prayer",t:"Visit, we beseech thee, O Lord, this dwelling, and drive far from it all snares of the enemy. Let thy holy angels dwell herein to preserve us in peace, and let thy blessing be always upon us. Through Christ our Lord. Amen."},
 {h:"Blessing",t:"V. May the almighty Lord grant us a quiet night and a perfect end.\nR. Amen."},
 {h:"Hail, Holy Queen (Marian antiphon)",t:C.prayers.hailHolyQueen}]};
fs.writeFileSync(path.join(R,"data/compline.json"),JSON.stringify(D,null,1)+"\n");console.log("compline sections:",D.sections.length);
