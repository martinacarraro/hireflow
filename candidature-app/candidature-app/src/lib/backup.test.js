import test from 'node:test'
import assert from 'node:assert/strict'
import {createBackup, restoreBackupData} from './backup.js'
function storage(initial={}) {
 const s={...initial};let fail=false
 Object.defineProperties(s,{
  getItem:{value:k=>Object.hasOwn(s,k)?s[k]:null},
  setItem:{value:(k,v)=>{if(fail&&k==='lfs_profile'){fail=false;throw Error('QuotaExceededError')}s[k]=String(v)}},
  removeItem:{value:k=>{delete s[k]}},failNext:{value:()=>{fail=true}}
 });return s
}
const candidate={id:'test-1',azienda:'Test',ruolo:'Designer',stato:'Inviata',sede:'',paese:'',interviews:[]}
test('export and restore preserve applications, profile, checklist and preferences',()=>{
 const original=storage({lfs_checklist_test:'[{"done":true}]',lfs_lang:'it',lingua:'it',unrelated:'keep'})
 const backup=createBackup(original,{nome:'Test',xp_points:150},[candidate])
 const target=storage({lfs_application_draft_v1:'old',unrelated:'keep'})
 restoreBackupData(target,JSON.parse(JSON.stringify(backup)))
 assert.deepEqual(JSON.parse(target.lfs_candidature),[candidate]);assert.equal(JSON.parse(target.lfs_profile).xp_points,150)
 assert.equal(target.lfs_checklist_test,original.lfs_checklist_test);assert.equal(target.lfs_lang,'it')
 assert.equal(target.lfs_application_draft_v1,undefined);assert.equal(target.unrelated,'keep')
})
test('malformed or duplicate records cannot erase existing data',()=>{
 for(const list of [[null],[{}],[candidate,candidate]]) {
 const target=storage({lfs_candidature:'original',lfs_profile:'original'});const before={...target}
 assert.throws(()=>restoreBackupData(target,{version:2,profile:{},candidature:list}));assert.deepEqual({...target},before)
 }
})
test('write failure rolls back every changed key',()=>{
 const target=storage({lfs_candidature:'original',lfs_profile:'old profile',lfs_application_draft_v1:'draft',lingua:'en',unrelated:'keep'});const before={...target}
 target.failNext();assert.throws(()=>restoreBackupData(target,{version:2,profile:{nome:'New'},candidature:[candidate],local_storage:{lfs_new:'new',lingua:'it'}}),/restore-failed/)
 assert.deepEqual({...target},before)
})
