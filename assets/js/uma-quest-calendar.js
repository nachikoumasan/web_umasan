(function(root){
'use strict';
// The early test starts two days before the public event; quest IDs/dates stay fixed.
const shift=(day,days)=>new Date(Date.parse(day+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);
const calendar={testStart:'2026-09-29',eventDay:day=>shift(day,2),testDay:day=>shift(day,-2)};
if(typeof module==='object'&&module.exports)module.exports=calendar;else root.UmaQuestCalendar=calendar;
})(typeof window==='object'?window:globalThis);
