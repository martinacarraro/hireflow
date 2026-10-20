import test from 'node:test'
import assert from 'node:assert/strict'
import {flowStats,averageWaitingDays,waitingSince,normalizeTransition} from './applicationFlow.js'
const now=new Date('2026-10-20T12:00:00')
const base={id:'1',azienda:'Test',ruolo:'Designer',stato:'Inviata',data_invio:'2026-10-01',interviews:[]}
test('cancelled interviews are excluded, future ones planned, completed ones counted',()=>{
 const interviews=[{id:'1',date:'2026-10-05',status:'scheduled'},{id:'2',date:'2026-10-10',status:'cancelled'},{id:'3',date:'2026-10-20',status:'completed'},{id:'4',date:'2026-10-22',status:'scheduled'}]
 const c={...base,stato:'Colloquio',interviews};assert.equal(flowStats([c],now).colloqui,2);assert.equal(flowStats([c],now).programmati,1)
})
test('wait uses last real contact at supplied date, ignores cancelled and future dates',()=>{
 const c={...base,ultimo_contatto:'2026-10-10',attesa_dal:'2026-11-01',interviews:[{date:'2026-10-18',status:'cancelled'},{date:'2026-10-25',status:'scheduled'}]}
 assert.equal(waitingSince(c,now),'2026-10-10');assert.equal(averageWaitingDays([c],now),10)
 assert.equal(averageWaitingDays([base,{...base,stato:'Assunta'},{...base,archiviata:true}],now),19)
 assert.equal(averageWaitingDays([{...base,data_invio:''}],now),null)
 assert.equal(averageWaitingDays([{...base,data_invio:'2026-02-31'}],now),null)
})
test('new and cleared locations remain empty through save normalization',()=>{
 const row=normalizeTransition(null,{...base,sede:'',paese:''},now);assert.equal(row.sede,'');assert.equal(row.paese,'')
 const cleared=normalizeTransition({...row,sede:'Roma, Italia',paese:'Italia'},{sede:'',paese:''},now);assert.equal(cleared.sede,'');assert.equal(cleared.paese,'')
})
