// Seals the private area's data file. Usage: node tools/private_seal.js <passwordFile> [plaintextStateJson]
// Without a state file it writes the EMPTY TEMPLATE. The password is read from the file and never printed. Only ciphertext is written into the repo.
const fs=require("fs"),path=require("path"),C=require("../"+fs.readdirSync(path.join(__dirname,"..")).find(d=>/^p-[0-9a-f]{24}$/.test(d))+"/crypto.js"),dir=fs.readdirSync(path.join(__dirname,"..")).find(d=>/^p-[0-9a-f]{24}$/.test(d)),S=require("../"+dir+"/state.js");
const pw=fs.readFileSync(process.argv[2],"utf8").trim(),st=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],"utf8")):S.defaults();
if(!S.valid(st)||pw.length<16)throw Error("bad state or password too short");
C.sealState(pw,st).then(r=>{fs.writeFileSync(path.join(__dirname,"..",dir,"data.enc.json"),JSON.stringify(r.blob)+"\n");console.log("sealed",dir+"/data.enc.json",fs.statSync(path.join(__dirname,"..",dir,"data.enc.json")).size,"bytes")});
