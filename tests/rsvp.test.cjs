const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto} = require('node:crypto');

function fixture({postFailure = false, countFailure = false} = {}) {
  class Element {
    constructor() { this.value = ''; this.checked = false; this.hidden = false; this.disabled = false; this.textContent = ''; this.innerHTML = ''; this.listeners = {}; this.attributes = {}; this.classList = {add(){},remove(){},toggle(){}}; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    setAttribute(k,v) { this.attributes[k] = v; }
    scrollIntoView() {}
    focus() {}
    querySelectorAll() { return []; }
  }
  const ids = ['rsvp-form','attend-yes','attend-no','attendance-extra','rsvp-submit','form-feedback','success-state','rsvp-verification','verification-status','retry-verification','guest-name','party-size','little-people-icons','guest-preview','attendance-parade','attendance-total','attendance-count-note','attendance-trucks','attendance-overflow','contact-website','additional-names','diet','message','success-title','success-message','success-party','another-rsvp'];
  const nodes = Object.fromEntries(ids.map(id=>['#'+id,new Element()]));
  const get = id => nodes['#'+id];
  get('success-state').hidden = true;
  get('guest-name').value = 'Test Guest';
  get('party-size').value = '3';
  get('additional-names').value = 'Companion A, Companion B';
  get('diet').value = 'Vegetarian';
  get('message').value = 'A private message';
  get('attendance-total').textContent = 'Loading the guest count…';
  get('attendance-extra').querySelectorAll = () => [get('party-size'),get('additional-names'),get('diet')];
  get('rsvp-form').reset = () => {};
  let widget, resets = 0, fail = postFailure;
  const calls = [];
  const window = {HOUSEWARMING_CONFIG:{rsvpProvider:'cloudflare',rsvpApi:'https://housewarming-rsvp.prathiksha11.workers.dev',turnstileSitekey:'public-key'},matchMedia:()=>({matches:true}),addEventListener(){},turnstile:{render(_s,options){widget=options;return 'widget';},reset(){resets++;}}};
  const document = {documentElement:{classList:{add(){}}},querySelector:s=>nodes[s]||null,querySelectorAll:()=>[],addEventListener(){},hidden:false};
  class FormData {
    constructor() { this.data = new Map([['full_name',get('guest-name').value],['message',get('message').value]]);for (const [key,id] of [['party_size','party-size'],['additional_guest_names','additional-names'],['food_preference','diet']]) if(!get(id).disabled)this.data.set(key,get(id).value); }
    get(k){return this.data.get(k);}
    set(k,v){this.data.set(k,v);}
    delete(k){this.data.delete(k);}
  }
  const fetch = async (url, options={}) => {
    calls.push({url,options});
    if(url.endsWith('/count')) { if(countFailure) throw Error('offline');return {ok:true,json:async()=>({total:9})}; }
    if(fail){fail=false;throw Error('network interrupted');}
    return {ok:true,json:async()=>({success:true})};
  };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8'),{window,document,location:{search:'',origin:'https://prathiksha11.github.io',pathname:'/-housewarming-rsvp/'},URLSearchParams,URL,Date,Number,Boolean,String,JSON,Error,Array,Math,FormData,fetch,crypto:webcrypto,AbortSignal,requestAnimationFrame:fn=>fn(),setTimeout(){},setInterval(){},navigator:{}});
  return {get,calls,verify:()=>widget.callback('valid-token'),resets:()=>resets,emit:async(id,type)=>{for(const fn of get(id).listeners[type]||[])await fn({preventDefault(){}});},setFailure:()=>{fail=true;}};
}
const settle = () => new Promise(resolve=>setImmediate(resolve));

test('verification is required before any RSVP is posted', async()=>{
  const f=fixture();assert.equal(f.get('rsvp-submit').disabled,true);f.get('attend-yes').checked=true;await f.emit('rsvp-form','submit');assert.equal(f.calls.filter(x=>x.url.endsWith('/rsvp')).length,0);assert.equal(f.get('success-state').hidden,true);
});
test('an acceptance saves the full party and private details only to the Worker',async()=>{
  const f=fixture();f.verify();f.get('attend-yes').checked=true;await f.emit('attend-yes','change');await f.emit('rsvp-form','submit');const call=f.calls.find(x=>x.url.endsWith('/rsvp'));const body=JSON.parse(call.options.body);assert.equal(body.attending,'yes');assert.equal(body.party_size,3);assert.equal(body.additional_guest_names,'Companion A, Companion B');assert.equal(body.message,'A private message');assert.equal(body.turnstile_token,'valid-token');assert.equal('email' in body,false);assert.match(body.id,/^[0-9a-f-]{36}$/);assert.equal(f.get('rsvp-form').hidden,true);assert.equal(f.get('success-state').hidden,false);assert.match(f.get('success-party').innerHTML,/Your party is on the way/);
});
test('a decline is saved with zero guests and omits attendance-only details',async()=>{
  const f=fixture();f.verify();f.get('attend-no').checked=true;await f.emit('attend-no','change');await f.emit('rsvp-form','submit');const body=JSON.parse(f.calls.find(x=>x.url.endsWith('/rsvp')).options.body);assert.equal(body.attending,'no');assert.equal(body.party_size,0);assert.equal(body.additional_guest_names,'');assert.equal(body.food_preference,'');assert.equal(f.get('success-party').hidden,true);assert.equal(f.get('success-title').textContent,"We'll miss you!");
});
test('an uncertain network result does not show success; retry reuses the same id',async()=>{
  const f=fixture({postFailure:true});f.verify();f.get('attend-yes').checked=true;await f.emit('rsvp-form','submit');assert.equal(f.get('success-state').hidden,true);assert.equal(f.resets(),1);assert.equal(f.get('rsvp-submit').disabled,true);f.verify();await f.emit('rsvp-form','submit');const posts=f.calls.filter(x=>x.url.endsWith('/rsvp')).map(x=>JSON.parse(x.options.body));assert.equal(posts.length,2);assert.equal(posts[0].id,posts[1].id);assert.equal(f.get('success-state').hidden,false);
});
test('the shared count renders one character per guest across trucks',async()=>{
  const f=fixture();await settle();assert.equal(f.get('attendance-total').textContent,'9 guests are coming!');const art=f.get('attendance-trucks').innerHTML;assert.equal((art.match(/<g transform=/g)||[]).length,9);assert.equal((art.match(/class="folk-truck"/g)||[]).length,2);assert.ok(!art.includes('Test Guest'));assert.equal(f.calls.filter(x=>x.url.endsWith('/count')).every(x=>!x.options.body),true);
});
test('an unavailable count is not presented as zero attendees',async()=>{
  const f=fixture({countFailure:true});await settle();assert.equal(f.get('attendance-total').textContent,'A place for everyone');assert.match(f.get('attendance-count-note').textContent,/temporarily unavailable/);
});
