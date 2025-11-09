import '@testing-library/jest-dom'

// setImmediate 폴리필 (Prisma 필요)
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args)
}
