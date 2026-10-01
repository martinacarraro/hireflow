import test from 'node:test'
import assert from 'node:assert/strict'
import { getInterviews, newInterview, ensureStageInterview, normalizeTransition, validationIssues, upcomingInterviews, agendaEvents, flowStats, hasOffer, hasResponse, needsFollowUp, duplicateApplication, dueReminders, waitingSince } from './applicationFlow.js'
import { calendarFile } from './calendarExport.js'

const now = new Date('2026-10-01T10:00:00')
const base = {id:'a',azienda:'Acme',ruolo:'Designer',stato:'Inviata',data_invio:'2026-09-01'}
const meeting = (order,date,status='scheduled') => ({...newInterview(order),date,time:'14:00',status})

test('direct second interview uses the second date, first date remains optional',()=>{
  let c={...base,stato:'Secondo colloquio',interviews:[]}
  c.interviews=ensureStageInterview(c).map(e=>({...e,date:'2026-10-02'}))
  const saved=normalizeTransition(null,c,now)
  assert.equal(saved.data_colloquio,null)
  assert.equal(saved.data_secondo_colloquio,'2026-10-02')
  assert.deepEqual(validationIssues(saved),[])
  assert.equal(upcomingInterviews(saved,now,7).length,1)
})
test('ambiguous legacy date survives without being assigned to a guessed stage',()=>{
  const c={...base,stato:'Secondo colloquio',data_colloquio:'2026-10-02'}
  assert.equal(getInterviews(c)[0].needsReview,true)
  assert.equal(ensureStageInterview(c).length,1)
  assert.equal(upcomingInterviews(c,now).length,0)
  assert.equal(normalizeTransition(c,{note:'Keep original'},now).data_colloquio,'2026-10-02')
})
test('calendar supports third meeting, excludes cancelled and closed future meetings',()=>{
  const c={...base,interviews:[meeting(1,'2026-09-05','completed'),meeting(2,'2026-10-02','cancelled'),meeting(3,'2026-10-03')]}
  assert.equal(agendaEvents(c,now).length,2)
  assert.equal(upcomingInterviews(c,now).length,1)
  assert.equal(agendaEvents({...c,stato:'Rifiutata'},now).length,1)
  assert.equal(upcomingInterviews({...c,archiviata:true},now).length,0)
})
test('sequence, missing dates and salary checks catch contradictory data',()=>{
  assert.ok(validationIssues({...base,interviews:[meeting(1,'2026-09-10'),meeting(2,'2026-09-08')]}).includes('sequence'))
  assert.ok(validationIssues({...base,interviews:[meeting(1,'')]}).includes('timeWithoutDate'))
  assert.ok(validationIssues({...base,interviews:[meeting(1,'2026-08-01')]}).includes('beforeApplication'))
  assert.ok(validationIssues({...base,stipendio_min:'35000',stipendio_max:'28000'}).includes('salaryRange'))
  assert.deepEqual(validationIssues({...base,interviews:[meeting(1,'2026-09-01','completed')],stipendio_min:0,stipendio_max:10000}),[])
})
test('state transitions retain notes, offer history and clear obsolete response deadlines',()=>{
  const c={...base,stato:'Offerta ricevuta',note:'Notes to keep',data_scadenza_responso:'2026-09-20'}
  const declined=normalizeTransition(c,{stato:'Offerta rifiutata',offerta_risposta:'no'},now)
  assert.equal(declined.note,c.note)
  assert.equal(declined.data_scadenza_responso,null)
  assert.ok(hasOffer(declined))
  assert.ok(declined.history.some(h=>h.stato==='Offerta ricevuta'))
  assert.equal(needsFollowUp(declined,now),false)
})
test('waiting does not imply an interview or a reply; rejection does imply a reply',()=>{
  assert.equal(hasResponse({...base,stato:'In attesa risposta'}),false)
  assert.equal(hasResponse({...base,stato:'Rifiutata'}),true)
  const stats=flowStats([{...base,stato:'In attesa risposta'},{...base,stato:'Offerta rifiutata',interviews:[meeting(1,'2026-09-04','completed')]}])
  assert.equal(stats.colloqui,1);assert.equal(stats.offerte,1);assert.equal(stats.risposte,1)
})
test('waiting starts at latest recorded contact rather than application creation',()=>{
  const c={...base,stato:'In attesa risposta',attesa_dal:'2026-09-28',ultimo_contatto:'2026-09-30'}
  assert.equal(waitingSince(c),'2026-09-30')
})
test('duplication does not retain archive, interviews, response, reminder or XP history',()=>{
  const c=duplicateApplication({...base,stato:'Assunta',archiviata:true,interviews:[meeting(1,'2026-10-03')],offerta_risposta:'si',data_inizio:'2026-11-01',reminder_date:'2026-10-03',xp_awards:{offer:true}},now)
  assert.equal(c.archiviata,false);assert.equal(c.stato,'Inviata');assert.deepEqual(c.interviews,[])
  for(const key of ['offerta_risposta','data_inizio','reminder_date','xp_awards'])assert.equal(c[key],undefined)
})
test('reminders respect opt out, archive, completion and closed states',()=>{
  const c={...base,reminder_date:'2026-10-01',reminder_time:'09:00'}
  assert.equal(dueReminders(c,now).length,1)
  for(const patch of [{notifiche_push:false},{archiviata:true},{reminder_done:true},{stato:'Assunta'},{stato:'Offerta rifiutata'}])assert.equal(dueReminders({...c,...patch},now).length,0)
})
test('calendar export keeps date-only events all-day and escapes notes',()=>{
  const text=calendarFile({id:'123',title:'Acme, HR',date:'2026-10-03',notes:'First\nSecond'})
  assert.ok(text.includes('DTSTART;VALUE=DATE:20261003'))
  assert.ok(text.includes('SUMMARY:Acme\\, HR'))
  assert.ok(text.includes('DESCRIPTION:First\\nSecond'))
  assert.ok(calendarFile({id:'123',title:'Interview',date:'2026-10-03',time:'14:30'}).includes('DTSTART:20261003T143000'))
})
