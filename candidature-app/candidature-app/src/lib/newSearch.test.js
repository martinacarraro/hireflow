import test from 'node:test'
import assert from 'node:assert/strict'
import { eligibleHire } from './newSearch.js'
test('new search prompt waits 30 days and remembers dismissal',()=>{
 const c={id:'a',stato:'Assunta',hired_at:'2026-09-01T12:00:00Z'}
 assert.equal(eligibleHire([c],{},new Date('2026-10-01T11:59:00Z')),undefined)
 assert.equal(eligibleHire([c],{},new Date('2026-10-01T12:00:00Z')).id,'a')
 assert.equal(eligibleHire([c],{new_search_asked:['a:'+c.hired_at]},new Date('2026-11-01')),undefined)
 assert.equal(eligibleHire([{...c,stato:'Rifiutata'}],{},new Date('2026-11-01')),undefined)
 assert.equal(eligibleHire([{id:'old',stato:'Assunta'}],{},new Date('2026-11-01')),undefined)
 assert.equal(eligibleHire([c,{...c,id:'b',hired_at:'2026-10-25'}],{},new Date('2026-11-01')),undefined)
})
