/**
 * GO / NO-GO — response inhibition and cognitive flexibility.
 *
 * One stimulus at a time. Touch it when it belongs to the "go" category;
 * keep your hands away when it does not. Powers Go/No-Go Animals, Rule Switch
 * (the go category changes mid-round) and Safe or Unsafe under time pressure.
 *
 * Four distinct outcomes, all of which mean different things clinically:
 *   go + touched      → CORRECT
 *   go + no touch     → OMISSION        (inattention, or motor too slow)
 *   no-go + touched   → FALSE_ALARM     (the inhibition failure — the headline)
 *   no-go + no touch  → CORRECT_INHIBIT (a success that looks like nothing)
 *
 * Withholding correctly is celebrated, quietly. If stopping produced no
 * feedback at all, a child would have no way to learn that stopping was right.
 *
 * What a round contains is planned in goNoGoPlan.js: which rule pair it plays,
 * that each rule is met by at least two "leave it alone" turns, and that
 * pictures do not repeat until all have been shown.
 */
import { OUTCOME } from '../core/telemetry'
import { DwellSelector } from '../core/interactions'
import { ArrivalGate, layoutClearOf } from '../core/arrival'
import { layoutSlots, clamp } from '../core/geometry'
import { getSettings, accommodate } from '../core/settings'
import {
  drawTarget, drawHandCursor, drawSkeleton, PALETTE, hexA, edgeFlash, roundRect,
} from '../core/draw'
import { HAND_BONES } from '../core/vision'
import {
  TrialMachine, pointersFor, handsFor, makeTargets, pulse, Trail, contactError,
} from './base'
import { resolveDifficulty } from '../core/adaptive'
import { getSets } from '../content'
import { pickVariant, segmentOf, minNoGoFor, chooseGo, drawFresh } from './goNoGoPlan'

/** The rule pair each game played last, so the next round plays a different one. */
const LAST_VARIANT = new Map()

/**
 * @param {object} game `game.config`:
 *   trials       total stimuli (default 18)
 *   goSets       content sets the go items come from
 *   noGoSets     content sets the no-go items come from
 *   goTest       (item) => boolean — overrides the set split (e.g. attrs.safety)
 *   goLabel      what to call the go category, e.g. 'dogs'
 *   noGoLabel    what to call the no-go category
 *   ruleSwitch   true to swap the categories half way (Rule Switch)
 *   holdMs       how long a no-go stimulus must be *left alone* to count
 *   only         (item) => boolean — keeps a picture in or out of both pools
 *   variants     [{ goSets, noGoSets, goCats|goTest, goLabel, noGoLabel, only }]
 *                alternative rule pairs. A round plays one of them, never the
 *                one it played last, so the rule is not always the same pair.
 */
export function goNoGoEngine(game) {
  const cfg = {
    trials: 18,
    goSets: ['animals'],
    noGoSets: ['animals'],
    goLabel: 'the go one',
    noGoLabel: 'the other one',
    ruleSwitch: false,
    ...(game.config || {}),
  }

  let api = null
  let machine = null
  let selector = null
  const trail = new Trail(14)
  let target = null
  let isGo = true
  let switched = false
  let ruleFlipAt = null
  let flashColor = null
  let flashUntil = 0
  let inhibitGlow = 0
  /** The rule pair this round plays: `cfg`, or `cfg` overlaid with a variant. */
  let rule = cfg
  /** Pictures already shown under the current rule, so none repeats early. */
  const shown = new Set()
  let lastItemId = null
  // A picture must be reached for: see core/arrival.js.
  const gate = new ArrivalGate()
  let gatePending = false
  let lastPointers = []
  let lastStage = null

  /** Current category labels, which the Rule Switch variant swaps. */
  function labels() {
    return switched
      ? { go: rule.noGoLabel, noGo: rule.goLabel }
      : { go: rule.goLabel, noGo: rule.noGoLabel }
  }

  /**
   * Is this item currently a "go"? `goTest` wins, then a category list.
   * The Rule Switch variant inverts the answer rather than re-picking pools, so
   * the identical stimulus set carries both rules — which is the whole point:
   * the child has to update the rule, not learn new pictures.
   */
  function classify(item) {
    const base = rule.goTest
      ? Boolean(rule.goTest(item))
      : (rule.goCats || []).some((c) => (item.cats || []).includes(c))
    return switched ? !base : base
  }

  /** "Leave it alone" turns already played under the rule now in force. */
  function noGoSince(start) {
    return machine ? machine.results.slice(start).filter((r) => r.rule === 'noGo').length : 0
  }

  function buildTrial(index, level) {
    const s = getSettings()
    const spec = accommodate({ radius: level.targetSize ?? 0.12, windowMs: level.windowMs || 2600 }, s)

    if (cfg.ruleSwitch && ruleFlipAt === null) {
      // Flip a little past halfway, so the first rule is genuinely established
      // before it is pulled away — that is what makes the switch cost visible.
      ruleFlipAt = Math.floor(cfg.trials * 0.55)
    }
    if (cfg.ruleSwitch && index === ruleFlipAt && !switched) {
      switched = true
      // The same pictures now mean the opposite, so all of them are new again.
      shown.clear()
      const l = labels()
      api.banner('NEW RULE!', 1400, PALETTE.yellow)
      api.sfx.levelUp()
      api.haptic('start')
      void api.say(`New rule! Now touch ${l.go}. Do not touch ${l.noGo}.`, {
        main: 'New rule!',
        sub: `Touch ${l.go} · leave ${l.noGo}`,
      })
    }

    const keep = rule.only || (() => true)
    const goPool = getSets(rule.goSets).filter(keep).filter((i) => classify(i))
    const noGoPool = getSets(rule.noGoSets).filter(keep).filter((i) => !classify(i))
    if (!goPool.length || !noGoPool.length) return null

    // The mix is random at the level's rate, inside two guarantees: never three
    // "leave it alone" turns running, and at least two of them under each rule —
    // at 15 % a rule could otherwise go by having been met once, or not at all.
    const seg = segmentOf(index, cfg.trials, cfg.ruleSwitch ? ruleFlipAt : null)
    isGo = chooseGo({
      noGoRate: level.noGoRate ?? 0.3,
      roll: api.rng(),
      recent: machine ? machine.results.map((r) => r.rule) : [],
      remaining: seg.remaining,
      noGoSoFar: noGoSince(seg.start),
      minNoGo: minNoGoFor(seg.length),
    })

    const item = drawFresh(isGo ? goPool : noGoPool, shown, api.rng, lastItemId)
    lastItemId = item.id
    const box = api.reachBox(level.eccentricity ?? 1)
    // Not under a hand that is already there: a picture that appears beneath a
    // resting finger is touched before the child has seen what it is, which on
    // a "leave it alone" turn is a mistake they never made.
    const slot = layoutClearOf(() => layoutSlots(1, box, spec.radius, api.rng), lastPointers, {
      stageW: lastStage?.stageW,
      stageH: lastStage?.stageH,
      clear: spec.radius * 1.5,
    })[0]
    ;[target] = makeTargets([item], [slot], { radius: spec.radius, spriteKind: 'emoji', captions: true })
    target.color = isGo ? 'green' : 'red'

    selector = new DwellSelector({ dwellMs: Math.min(spec.dwellMs, 200) })
    inhibitGlow = 0
    gate.reset()
    gatePending = true

    return {
      targetId: item.id,
      radius: spec.radius,
      windowMs: spec.windowMs,
      rule: isGo ? 'go' : 'noGo',
      ruleSwitched: switched,
      choiceCount: 1,
      isGo,
      labels: labels(),
    }
  }

  function onPhase(phase, trial) {
    if (phase !== 'prompt' || !trial) return
    const l = trial.labels
    api.setPrompt({ main: `Touch ${l.go}`, sub: `Leave ${l.noGo} alone` })
    // The stimulus is up almost immediately: a long prompt phase would let the
    // child pre-plan and the task would stop measuring inhibition.
    machine.clock.after(280, () => {
      api.sfx.appear(trial.isGo ? 4 : -3)
      machine.setPhase('respond')
    })
  }

  const module = {
    requires: 'hand',

    difficultySnapshot() {
      const { level, promptStage } = resolveDifficulty(game)
      return { ...level, promptStage }
    },

    mount(a) {
      api = a
      switched = false
      ruleFlipAt = null
      shown.clear()
      lastItemId = null
      rule = cfg
      if (cfg.variants?.length) {
        const vi = pickVariant(cfg.variants.length, LAST_VARIANT.get(game.id) ?? null, api.rng)
        LAST_VARIANT.set(game.id, vi)
        rule = { ...cfg, ...cfg.variants[vi] }
        api.recorder.event?.('ruleVariant', { index: vi, go: rule.goLabel, noGo: rule.noGoLabel })
      }
      machine = new TrialMachine({
        api,
        totalTrials: cfg.trials,
        build: buildTrial,
        onPhase,
        feedbackMs: 850,
      })
      api.setHud({ total: cfg.trials })
      const l = labels()
      void api.say(`Touch ${l.go}. Do not touch ${l.noGo}.`, {
        main: `Touch ${l.go}`,
        sub: `Leave ${l.noGo} alone`,
      })
      machine.clock.after(1600, () => machine.next())
    },

    update(f) {
      if (!machine || machine.ended) return
      const { frame, dt, now, stageW, stageH } = f
      const s = getSettings()
      const pointers = pointersFor(frame, s)
      const hands = handsFor(frame, s)
      // Remembered even before the first picture, so that one too can be laid
      // out clear of where the hands already are.
      lastPointers = pointers
      lastStage = { stageW, stageH }
      if (!machine.trial) return
      trail.push(pointers[0])
      machine.reach.step(hands[0] || null, now)

      if (gatePending) {
        gate.watch([target], pointers, { stageW, stageH, now })
        gatePending = false
      } else {
        gate.step([target], pointers, { stageW, stageH, now })
      }

      if (machine.phase !== 'respond') return

      // Correctly withholding: reward the *effort* of holding back with a
      // growing calm glow, so "doing nothing" is visibly the right answer.
      if (!machine.trial.isGo) {
        inhibitGlow = clamp(inhibitGlow + dt * 1.4, 0, 1)
      }

      const res = selector.step([target], pointers, {
        dt, now, stageW, stageH, isHeld: (id) => gate.isHeld(id),
      })

      if (machine.window?.expired()) {
        if (machine.trial.isGo) {
          flashColor = null
          machine.resolve({
            accuracy: OUTCOME.OMISSION,
            timedOut: true,
            target,
            chosenId: null,
          })
          api.setPrompt({ main: 'That one was a "touch it".', sub: target.item.label })
        } else {
          flashColor = PALETTE.green
          flashUntil = now + 500
          machine.resolve({
            accuracy: OUTCOME.CORRECT_INHIBIT,
            target,
            chosenId: null,
            // Honest about the one odd case: the picture appeared under a hand
            // that then never moved. Not a touch, but not a reach held back.
            note: gate.isHeld(target.id) ? 'withheld-hand-resting' : 'withheld',
          })
          api.setPrompt({ main: 'Great stopping!', sub: `You left the ${target.item.label.toLowerCase()} alone` })
        }
        return
      }

      if (res.selected) {
        const err = contactError(res.pointer, target, stageW, stageH)
        if (machine.trial.isGo) {
          machine.resolve({
            accuracy: OUTCOME.CORRECT,
            chosenId: target.id,
            target,
            contactError: err,
            at: { x: target.x, y: target.y },
          })
          api.setPrompt({ main: 'Yes!', sub: target.item.label })
        } else {
          flashColor = PALETTE.orange
          flashUntil = now + 420
          machine.resolve({
            accuracy: OUTCOME.FALSE_ALARM,
            chosenId: target.id,
            target,
            contactError: err,
          })
          const l = machine.trial.labels
          api.setPrompt({ main: `Only ${l.go}!`, sub: `Leave ${l.noGo} alone` })
          void api.say(`Only touch ${l.go}`, { main: `Only ${l.go}!` })
        }
      }
    },

    render(f) {
      const { view, frame, now } = f
      if (!machine || !target) return
      const s = getSettings()
      const p = pulse(now)
      const responding = machine.phase === 'respond'

      // A "leave it alone" halo around a no-go stimulus, growing while the child
      // holds back.
      if (responding && !machine.trial.isGo && inhibitGlow > 0.02 && !s.reducedMotion) {
        const ctx = view.ctx
        const r = view.pr(target.radius) * (1.6 + inhibitGlow * 0.8)
        const g = ctx.createRadialGradient(
          view.px(target.x), view.py(target.y), view.pr(target.radius),
          view.px(target.x), view.py(target.y), r
        )
        g.addColorStop(0, hexA(PALETTE.teal, 0))
        g.addColorStop(1, hexA(PALETTE.teal, 0.3 * inhibitGlow))
        ctx.save()
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(view.px(target.x), view.py(target.y), r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      drawTarget(view, target, {
        progress: responding ? selector.progressOf(target.id) : 0,
        hover: responding && selector.hovered === target.id,
        pulse: p,
        highlight: responding && machine.trial.isGo && machine.prompt?.highlightTarget === true,
        correct: machine.phase === 'feedback' && machine.lastOutcome === OUTCOME.CORRECT,
        wrong: machine.phase === 'feedback' && machine.lastOutcome === OUTCOME.FALSE_ALARM,
        reducedMotion: s.reducedMotion,
        highContrast: s.highContrast,
      })

      // A persistent legend: the rule must be re-readable at any moment,
      // especially right after a switch.
      if (machine.trial?.labels) {
        const ctx = view.ctx
        const fs = Math.max(11, view.short * 0.026)
        ctx.save()
        ctx.font = `700 ${fs}px Fredoka, system-ui, sans-serif`
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'left'
        const y = view.h - fs * 2.2
        const chip = (text, color, x) => {
          const w = ctx.measureText(text).width + fs * 1.6
          ctx.fillStyle = hexA(color, 0.22)
          ctx.strokeStyle = hexA(color, 0.7)
          ctx.lineWidth = 2
          roundRect(ctx, x, y - fs, w, fs * 2, fs)
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = '#fff'
          ctx.fillText(text, x + fs * 0.8, y)
          return x + w + fs * 0.5
        }
        let x = view.short * 0.03
        x = chip(`✋ ${machine.trial.labels.go}`, PALETTE.green, x)
        chip(`⛔ ${machine.trial.labels.noGo}`, PALETTE.red, x)
        ctx.restore()
      }

      if (s.showSkeleton) {
        for (const h of frame.hands) {
          drawSkeleton(view, h.lm, HAND_BONES, {
            color: h.side === 'left' ? 'rgba(46,230,208,0.5)' : 'rgba(255,217,61,0.5)',
          })
        }
      }
      for (const h of frame.hands) {
        drawHandCursor(view, h, { trail: h === frame.hands[0] ? trail.points : null, reducedMotion: s.reducedMotion })
      }

      if (flashColor && now < flashUntil && !s.reducedMotion) {
        edgeFlash(view, flashColor, (flashUntil - now) / 500)
      }
    },

    unmount() {
      selector?.reset()
      gate.reset()
      machine = null
      target = null
    },
  }

  return module
}
