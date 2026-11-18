// The shared analytics endpoints mounted for each existing role (FND-041).
// Same handlers, different "who may I look at" rule in front of each.
const analytics = require('../controllers/analyticsController')
const scopes = require('../utils/scopes')
const { scoped } = scopes

const handlers = (router, base, ...guards) => {
  for (const [name, h] of Object.entries({ overview: analytics.overview, calendar: analytics.calendar, matrix: analytics.matrix, patterns: analytics.patterns, timeline: analytics.timeline })) {
    router.get(`${base}/${name}`, ...guards, h)
  }
}

// Parent: GET /api/parent/children/:id/analytics/{overview,calendar,matrix,patterns,timeline}
function mountParent(router) {
  handlers(router, '/children/:id/analytics', scoped((req) => scopes.forParentChild(req.parent, req.params.id)))
}

// Teacher: a group, a student, or everyone they teach.
function mountTeacher(router) {
  handlers(router, '/batches/:id/analytics', scoped((req) => scopes.forTeacherBatch(req.teacher, req.params.id)))
  handlers(router, '/students/:id/analytics', scoped((req) => scopes.forTeacherStudent(req.teacher, req.params.id)))
  router.get('/batches/:id/analytics/learners', scoped((req) => scopes.forTeacherBatch(req.teacher, req.params.id)), analytics.learners)
  handlers(router, '/analytics', scoped((req) => scopes.forTeacherAll(req.teacher)))
  router.get('/analytics/learners', scoped((req) => scopes.forTeacherAll(req.teacher)), analytics.learners)
}

// Admin: the school, a unit of the school tree, a group, or a student.
// `/units/:id/analytics/...` needs the org.tree module (ADM-010); `unitGuards` lets the
// admin router put its module check in front. Staff are limited to their units by forAdmin.
function mountAdmin(router, { unitGuards = [] } = {}) {
  handlers(router, '/analytics', scoped((req) => scopes.forAdmin(req.admin, { batchId: req.query.batchId, unitId: req.query.unitId })))
  router.get('/analytics/learners', scoped((req) => scopes.forAdmin(req.admin, { batchId: req.query.batchId, unitId: req.query.unitId })), analytics.learners)
  handlers(router, '/students/:id/analytics', scoped((req) => scopes.forAdmin(req.admin, { studentId: req.params.id })))
  handlers(router, '/units/:id/analytics', ...unitGuards, scoped((req) => scopes.forAdmin(req.admin, { unitId: req.params.id })))
  router.get('/units/:id/analytics/learners', ...unitGuards, scoped((req) => scopes.forAdmin(req.admin, { unitId: req.params.id })), analytics.learners)
}

// Super admin: any organisation, or one of its students.
function mountSuperadmin(router) {
  handlers(router, '/organizations/:id/analytics', scoped((req) => scopes.forSuperadminOrg(req.params.id)))
  router.get('/organizations/:id/analytics/learners', scoped((req) => scopes.forSuperadminOrg(req.params.id)), analytics.learners)
  handlers(router, '/organizations/:id/students/:studentId/analytics', scoped((req) => scopes.forSuperadminOrg(req.params.id, { studentId: req.params.studentId })))
}

module.exports = { mountParent, mountTeacher, mountAdmin, mountSuperadmin }
