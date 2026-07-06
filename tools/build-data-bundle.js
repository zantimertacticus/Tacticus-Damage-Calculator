#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const rawDir = path.join(root, "assets", "data", "raw");
const rankLabels = ["Stone I","Stone II","Stone III","Iron I","Iron II","Iron III","Bronze I","Bronze II","Bronze III","Silver I","Silver II","Silver III","Gold I","Gold II","Gold III","Diamond I","Diamond II","Diamond III / Mythic I","Adamantine I / Mythic II","Adamantine II / Mythic III"];
function readJson(name){return JSON.parse(fs.readFileSync(path.join(rawDir,`${name}.json`),"utf8"));}
const raw={characters:readJson("characters"),progression:readJson("progression"),upgrades:readJson("upgrades"),items:readJson("items"),abilities:readJson("abilities"),damageProfiles:readJson("damageProfiles")};
function normaliseCharacter(id,ch){
  const stats=ch.stats||{};
  const weapons=(ch.weapons||[]).map(w=>({hits:w.hits,damageProfile:w.DamageProfile,piercingRatio:raw.damageProfiles[w.DamageProfile]?.PiercingRatio,range:w.Range}));
  const upgradeRows=Array.isArray(ch.upgrades)?ch.upgrades.map((row,rankIndex)=>{
    const inc=Array.isArray(ch.upgradesStatIncrease)?(ch.upgradesStatIncrease[rankIndex]||[]):[]; 
    return {rankIndex,rankLabel:rankLabels[rankIndex]||`Rank ${rankIndex}`,slots:(row||[]).map((upgradeId,slotIndex)=>{const u=raw.upgrades[upgradeId]||{};return {slot:slotIndex+1,upgradeId,name:u.name,rarity:u.rarity,statType:u.statType,statIncrease:inc[slotIndex]??null};})};
  }):[];
  return {id,name:ch.name,factionId:ch.FactionId,grandAllianceId:ch.GrandAllianceId,baseRarity:ch.BaseRarity,movement:ch.Movement,baseStats:{health:stats.Health,damage:stats.Damage,armour:stats.FixedArmor,progressionIndex:stats.ProgressionIndex},weapons,traits:ch.traits||[],activeAbilities:ch.activeAbilities||[],passiveAbilities:ch.passiveAbilities||[],mythicAbilities:ch.mythicAbilities||[],itemSlots:ch.itemSlots||[],releaseStatus:ch.releaseStatus,isMachineOfWar:(ch.traits||[]).includes("MachineOfWar"),upgradeRows};
}
const characters=Object.fromEntries(Object.entries(raw.characters).map(([id,ch])=>[id,normaliseCharacter(id,ch)]));
const bundle={meta:{source:"game configuration API files supplied by user",version:"1.5-data-foundation",counts:{characters:Object.keys(characters).length,machineOfWar:Object.values(characters).filter(c=>c.isMachineOfWar).length,progressionSteps:raw.progression.heroProgressionSteps?.length??0,upgrades:Object.keys(raw.upgrades).length,items:Object.keys(raw.items).length,abilities:Object.keys(raw.abilities).length,damageProfiles:Object.keys(raw.damageProfiles).length},futureEncounterModel:{playerTeamSlots:5,enemySide:{boss:null,adjutants:[null,null],note:"Reserved for guild raid boss plus two adjutant/prime/bodyguard units."}}},progression:raw.progression,damageProfiles:Object.fromEntries(Object.entries(raw.damageProfiles).map(([id,v])=>[id,{piercingRatio:v.PiercingRatio}])),characters};
fs.writeFileSync(path.join(root,"assets","data","tacticus-game-data.json"),JSON.stringify(bundle));
console.log("Built assets/data/tacticus-game-data.json");
