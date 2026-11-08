import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RENDERS, findRender } from '../shared/renders.js';
import { imageProblems } from '../shared/explainer-spec.js';

const pub = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const inPicture = (v) => typeof v === 'number' && v >= 0 && v <= 1;

test('every 3D render has its files, a title, tags and 3 to 8 parts', () => {
  const names = Object.keys(RENDERS);
  assert.ok(names.length >= 50, `only ${names.length} renders`);
  for (const [name, r] of Object.entries(RENDERS)) {
    assert.match(name, /^[a-z0-9-]+$/, name);
    assert.equal(r.src, `/renders/${name}.webp`, name);
    assert.ok(fs.existsSync(path.join(pub, r.src)), `${name}: missing ${r.src}`);
    if (r.loop) {
      const f = path.join(pub, r.loop);
      assert.ok(fs.existsSync(f), `${name}: missing ${r.loop}`);
      assert.ok(fs.statSync(f).size <= 2_000_000, `${name}: loop over 2 MB`);
    }
    assert.ok(typeof r.title === 'string' && r.title.length > 0, `${name}: title`);
    assert.ok(Array.isArray(r.tags) && r.tags.length > 0, `${name}: tags`);
    assert.ok(r.parts.length >= 3 && r.parts.length <= 8, `${name}: ${r.parts.length} parts`);
    for (const p of r.parts) {
      assert.ok(p.label.length > 0 && p.label.length <= 22, `${name}: label "${p.label}"`);
      assert.ok(p.note == null || p.note.length <= 70, `${name}: note for ${p.label}`);
      assert.ok(inPicture(p.x) && inPicture(p.y), `${name}: ${p.label} at ${p.x}, ${p.y}`);
      if (p.track) {
        assert.ok(r.loop, `${name}: ${p.label} has a track but no loop`);
        assert.ok(p.track.length >= 2 && p.track.every(([x, y]) => inPicture(x) && inPicture(y)), `${name}: ${p.label} track`);
      }
    }
  }
});

test('image ops naming a render are checked', () => {
  assert.deepEqual(imageProblems({ op: 'image', src: 'https://example.org/a.png' }), []);
  assert.deepEqual(imageProblems({ op: 'image', render: 'heart' }), []);
  assert.deepEqual(imageProblems({ op: 'image', render: 'heart', focus: 0 }), []);
  assert.equal(imageProblems({ op: 'image', render: 'no-such-thing' }).length, 1);
  assert.equal(imageProblems({ op: 'image', render: 'heart', focus: RENDERS.heart.parts.length }).length, 1);
  assert.equal(imageProblems({ op: 'image', render: 'heart', focus: -1 }).length, 1);
  assert.equal(imageProblems({ op: 'image', render: 'heart', focus: 1.5 }).length, 1);
  assert.deepEqual(imageProblems({ op: 'image', render: 'heart', parts: [0, 'Aorta'], focus: 1 }), []);
  assert.equal(imageProblems({ op: 'image', render: 'heart', parts: [0], focus: 1 }).length, 1);
  assert.equal(imageProblems({ op: 'image', render: 'heart', parts: ['Spleen'] }).length, 1);
  assert.deepEqual(imageProblems({ op: 'image', render: 'heart', parts: [{ label: 'Here', x: 0.5, y: 0.5 }] }), []);
  assert.equal(imageProblems({ op: 'image', render: 'heart', parts: [{ label: 'Here', x: 2, y: 0.5 }] }).length, 1);
  assert.equal(imageProblems({ op: 'image' }).length, 1);
});

test('a render can be found from words', () => {
  assert.equal(findRender('heart'), 'heart');
  assert.equal(findRender('the solar system'), 'solar-system');
  assert.equal(findRender('how does a volcano erupt'), 'volcano');
  assert.equal(findRender('how does a transformer work'), 'transformer');
  assert.equal(findRender('the Berlin Wall'), 'berlin-wall');
  assert.equal(findRender('shell and tube heat exchanger design'), 'heat-exchanger');
  assert.equal(findRender(''), null);
});
