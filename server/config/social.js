// Learning together (docs/learning/GAME-ROADMAP.md Phase 5): the numbers and the fixed
// lists behind friends, buddy rounds, team matches and their awards.
//
// The "everybody wins" rules these implement are promises to learners, not settings:
//   - points come from learning evidence, never from speed, minutes or days in a row;
//   - boards show teams and shared totals, never children from first to last;
//   - every team that reaches its goal wins the trophy, and every participant gets one true award;
//   - nothing is lost by missing a day, sitting out or leaving;
//   - children talk with preset cheers only (no free text, voice, photos or links).

// A player's public name is two friendly words chosen from these lists ("Brave Fox"),
// stored as their keys so every language can show its own words (together.nick.a.<key>).
const NICK_A = ['brave', 'bright', 'calm', 'clever', 'curious', 'gentle', 'happy', 'jolly', 'kind', 'lucky', 'merry', 'nimble', 'proud', 'quick', 'quiet', 'sunny', 'swift', 'wise', 'bold', 'cosy']
const NICK_N = ['fox', 'owl', 'otter', 'panda', 'tiger', 'koala', 'dolphin', 'hedgehog', 'rabbit', 'lion', 'penguin', 'turtle', 'bear', 'deer', 'eagle', 'seal', 'wolf', 'robin', 'whale', 'gecko']
// Avatars are pictures from a fixed set, never a photo.
const AVATARS = ['fox', 'owl', 'otter', 'panda', 'tiger', 'koala', 'dolphin', 'hedgehog', 'rabbit', 'lion', 'penguin', 'turtle', 'bear', 'deer', 'eagle', 'seal', 'wolf', 'robin', 'whale', 'gecko', 'rocket', 'star', 'rainbow', 'sun']

// Preset cheers: a sticker and a line, both from fixed lists (together.cheer.line.<key>).
const CHEER_STICKERS = ['star', 'heart', 'rocket', 'clap', 'rainbow', 'trophy', 'sun', 'highfive']
const CHEER_LINES = ['great_job', 'you_can', 'nice_comeback', 'thanks', 'well_played', 'go_team', 'proud', 'again']

// Teams of a match get a name and a colour from here, in order.
const TEAMS = [
  { key: 'comets', emoji: '☄️', color: '#339af0' },
  { key: 'sunflowers', emoji: '🌻', color: '#f59f00' },
  { key: 'otters', emoji: '🦦', color: '#20c997' },
  { key: 'dragons', emoji: '🐉', color: '#8b5cf6' },
]

// One true award per participant (G-512), tried in this order; `teammate` is always true.
const AWARDS = ['first_flag_star', 'best_comeback', 'most_improved', 'sharp_first_try', 'review_champion', 'curious_explorer', 'kindest_cheerer', 'team_spark', 'steady_helper', 'teammate']
// The true award each player of a friendly match or game duel also gets (content v5):
// sharp_first_try when half or more were right first time with no hint, else fair_play.
const MATCH_AWARDS = ['sharp_first_try', 'fair_play']
// Milestones of learning with others (content v5), each earned once, from real events only:
// { key, kinds (SocialAward kinds that count) or cheers (cheers sent), count }.
const MILESTONES = [
  { key: 'first_together', kinds: ['together'], count: 1 },
  { key: 'first_match', kinds: ['ribbon', 'brave'], count: 1 },
  { key: 'first_game_duel', kinds: ['game_ribbon', 'game_brave'], count: 1 },
  { key: 'five_with_friends', kinds: ['together', 'ribbon', 'brave', 'game_ribbon', 'game_brave'], count: 5 },
  { key: 'ten_with_friends', kinds: ['together', 'ribbon', 'brave', 'game_ribbon', 'game_brave'], count: 10 },
  { key: 'team_player', kinds: ['trophy'], count: 1 },
  { key: 'cheer_giver', cheers: true, count: 10 },
]

module.exports = {
  NICK_A, NICK_N, AVATARS, CHEER_STICKERS, CHEER_LINES, TEAMS, AWARDS, MATCH_AWARDS, MILESTONES,

  // Camera game duels (content v5): the same camera game, each at their own level; stars 0-3.
  duel: { openDays: 14, maxOpen: 10, maxStars: 3 },

  friends: {
    max: 30, // friends per learner
    codeLength: 6,
    // A friend code is letters and digits that are hard to mix up (no 0/O, 1/I/L).
    codeAlphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
    // Below this age a new friend needs a grown-up's OK when one is linked and has left that switch on.
    adultApprovalUnder: 13,
    requestTtlDays: 30,
  },

  cheers: {
    perDay: 5, // a learner can send this many a day (they count for the team once each)
    maxUnseen: 20,
  },

  // Buddy rounds and friendly matches: the same questions, each in their own time.
  match: {
    size: 5,
    minSize: 3,
    maxSize: 10,
    openDays: 14, // an unplayed match closes quietly after this
    maxOpen: 10, // open invitations a learner can have out at once
    modules: ['listen', 'read', 'write'], // speaking is checked by the microphone: not the same for two devices
    mysteryLevelGap: 1, // a mystery match pairs learners at most this many levels apart
  },

  // Team matches inside a group (teacher-run).
  team: {
    minTeams: 1, // one team = a class quest with one shared bar
    maxTeams: 4,
    minDays: 1,
    maxDays: 14,
    // A star is one right answer. At most this many a day count for the team per learner, so
    // playing for hours never beats learning a little each day (roadmap guardrail: never reward time).
    starsPerDayCap: 20,
    defaultStarsPerLearnerPerDay: 5, // the suggested goal: learners x days x this
    maxActivePerGroup: 3,
    balanceWindowDays: 14,
  },

  // Friends' star jar: everyone's stars this week in one jar (no table of who added what).
  jar: { milestones: [25, 75, 150, 300] },

  // Shorts (G-520..523).
  shorts: {
    page: 6,
    maxPage: 12,
    breakEvery: 8, // a break card after this many in a row (the client also follows the parent's limits)
    recentSeen: 300,
    likedMax: 200,
    mix: { liked: 0.5, fresh: 0.5 }, // half from what they like, half something new
    minWords: 12,
    maxSayChars: 420,
  },
}
