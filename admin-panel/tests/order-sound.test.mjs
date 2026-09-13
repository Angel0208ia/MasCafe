import test from 'node:test';
import assert from 'node:assert/strict';
import { playOrderTone } from '../src/lib/order-sound.ts';

function mock(state='running') {
  const calls=[];
  const gain={ gain: { setValueAtTime: (...v)=>calls.push(['gain',...v]), exponentialRampToValueAtTime: (...v)=>calls.push(['ramp',...v]) }, connect(){}, disconnect(){ calls.push(['disconnectGain']); } };
  const oscillator={ frequency: { setValueAtTime: (...v)=>calls.push(['frequency',...v]) },connect(){}, start: t=>calls.push(['start',t]),stop: t=>calls.push(['stop',t]),disconnect(){calls.push(['disconnectOscillator']);} };
  return {calls,oscillator,context:{state,currentTime:20,destination:{},createOscillator:()=>oscillator,createGain:()=>gain}};
}
test('suena inmediatamente y el pico es un poco mayor que antes',()=>{
  const {context,calls,oscillator}=mock();
  playOrderTone(context);
  assert.ok(calls.some(c=>c[0]==='start' && c[1]===20));
  assert.ok(calls.some(c=>c[0]==='ramp' && c[1]===.14));
  assert.ok(calls.some(c=>c[0]==='stop' && c[1]===20.46));
  oscillator.onended();
  assert.ok(calls.some(c=>c[0]==='disconnectGain'));
  assert.ok(calls.some(c=>c[0]==='disconnectOscillator'));
});
test('no reproduce audio si el navegador aún no lo ha habilitado',()=>{
  const {context,calls}=mock('suspended');
  playOrderTone(context);
  assert.deepEqual(calls,[]);
});
