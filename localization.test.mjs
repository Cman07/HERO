import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import language from './language.cjs';
import packs from './locales.cjs';
import recovery from './recovery.cjs';
import preparation from './preparedness.cjs';
import { immediateDanger, emergencyReply, instructionsFor, parseActionReply } from './chat-policy.mjs';

test('every added language covers the resident journey and preserves export literals', async () => {
  const source = JSON.parse(await readFile(new URL('./docs/localization-source.json', import.meta.url), 'utf8'));
  for (const code of Object.keys(language.languages).filter(code => !['en','es'].includes(code))) {
    assert.ok(packs[code], code);
    for (const key of source) {
      assert.ok(packs[code][key]?.trim(), `${code}: ${key}`);
      for (const literal of key.match(/\{\w+\}|\b911\b/g) || []) assert.ok(packs[code][key].includes(literal), `${code}: ${literal}`);
    }
    for (const need of recovery.needs) {
      const en = recovery.getPlan(need), translated = recovery.getPlan(need, code);
      assert.deepEqual(translated.map(action => action.id), en.map(action => action.id));
      translated.forEach((action,i) => { assert.notEqual(action.title,en[i].title); assert.equal(action.source.url,en[i].source.url); });
      const summary = recovery.textSnapshot({ need, language:code, currentLocality:'Fairfax city', summary:true, questions:'My own words <script>literal</script>', completedActionIds:[en[0].id] });
      assert.ok(summary.includes('Fairfax city')); assert.ok(summary.includes(language.languages[code].nativeName));
      assert.ok(summary.includes('[x]')); assert.ok(summary.includes('My own words <script>literal</script>'));
      assert.ok(summary.includes('911')); for (const action of en) assert.ok(summary.includes(action.source.url));
    }
    const checklist = preparation.checklistText(null, ['alerts']).split('\n').map(line => language.translate(line,code)).join('\n');
    assert.ok(checklist.includes('[x]')); assert.ok(checklist.includes('911'));
    assert.ok(checklist.includes('https://www.ready.gov/plan'));
    assert.ok(!checklist.includes('Choose how you will receive official alerts'));
  }
});

test('language formatting leaves identifiers, resident content and places intact', () => {
  for (const code of Object.keys(language.languages)) {
    for (const text of ['Fairfax city','yes','private@example.test','My arbitrary personal statement']) assert.equal(language.translate(text,code),text);
    assert.ok(language.translate('Signed in as resident_42',code).includes('resident_42'));
    assert.ok(language.translate('Current locality you entered: Fairfax city. Help requested: A place to stay.',code).includes('Fairfax city'));
    assert.ok(language.translate('Source: Ready.gov — Make a plan — https://www.ready.gov/plan',code).includes('https://www.ready.gov/plan'));
    assert.ok(instructionsFor(code).includes(language.languages[code].name));
    assert.ok(emergencyReply(code).includes('911'));
  }
  assert.equal(language.normalizeLanguage('__proto__'),'en');
  assert.equal(language.normalizeLanguage('unknown'),'en');
});

test('clear urgent disclosures in added languages route to the emergency response', () => {
  for (const message of ['لا أستطيع التنفس', '我无法呼吸', '숨을 쉴 수 없어요', 'tôi không thở được', 'hindi ako makahinga', 'Je ne peux pas respirer', 'Je suis en danger immédiat', 'Je me noie']) assert.equal(immediateDanger(message),true,message);
  for (const message of ['كيف أطلب المساعدة؟','我需要住房帮助','숙소가 필요해요','Tôi cần chỗ ở','Kailangan ko ng matutuluyan', 'Je peux respirer', 'Je ne suis pas en danger immédiat', 'Je ne me noie pas', 'J’ai besoin d’un hébergement']) assert.equal(immediateDanger(message),false,message);
  assert.equal(parseActionReply(JSON.stringify({reply:'请提供您的地址。',actionIds:[]}),[]),null);
  assert.ok(parseActionReply(JSON.stringify({reply:'Bạn có thể cho biết quận nơi thiệt hại xảy ra không?',actionIds:[]}),[]));
  assert.equal(parseActionReply(JSON.stringify({reply:'Vui lòng cung cấp địa chỉ của bạn.',actionIds:[]}),[]),null);
  assert.equal(parseActionReply(JSON.stringify({reply:'Veuillez fournir votre adresse.',actionIds:[]}),[]),null);
  assert.ok(parseActionReply(JSON.stringify({reply:'Dans quel comté les dégâts se sont-ils produits ?',actionIds:[]}),[]));
  assert.equal(parseActionReply(JSON.stringify({reply:'界'.repeat(1201),actionIds:[]}),[]),null);
  assert.equal(parseActionReply(JSON.stringify({reply:'这是一句话。'.repeat(41),actionIds:[]}),[]),null);
});

test('every page loads bundled language packs before translations and offers native labels', async () => {
  for (const page of ['index.html','plan.html','account.html']) {
    const html = await readFile(new URL(page,import.meta.url),'utf8');
    assert.ok(html.indexOf('./locales.cjs') < html.indexOf('./language.cjs'));
    for (const [code,locale] of Object.entries(language.languages)) assert.ok(html.includes(`value="${code}" lang="${code}"`), `${page}: ${code}`);
  }
  const sw = await readFile(new URL('sw.js',import.meta.url),'utf8');
  assert.ok(sw.includes("'/locales.cjs'"));
});
