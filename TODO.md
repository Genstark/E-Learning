# Performance Optimization TODO

## Backend Issues Identified
- [ ] Inefficient user queries: Loading all users with find().toArray() and looping in JS (signup/login routes)
- [ ] Cron job running every second initially (heavy if operations slow)
- [ ] Google API calls for questions generation (async but daily)
- [ ] Token encryption/decryption on every request
- [ ] No database indexes (assuming not optimized)

## Frontend Issues Identified
- [ ] task.vue: Heavy component (many reactive props, watchers, timers, large DOM, API calls)
- [ ] numberbowling.vue: Timers, localStorage ops, reactive data
- [ ] No lazy loading for components/routes
- [ ] Math.js evaluate called frequently
- [ ] No error boundaries/loading states
- [ ] External images without optimization

## General Issues
- [ ] No API response caching
- [ ] No pagination for data lists
- [ ] Bundle size not optimized
- [ ] No performance monitoring

## Backend Fixes
- [x] Optimize user lookup queries in server/index.js
- Replace find().toArray() with findOne({ email/name }) for signup/login
- [ ] Optimize cron job scheduling
- [ ] Cache questions/dice data if possible
- [ ] Add database indexes for users collection

## Frontend Fixes
- [ ] Optimize task.vue
  - Reduce reactive properties/watchers
  - Clear timers in onUnmounted
  - Add loading states for API calls
  - Optimize template (v-if, reduce DOM)
- [ ] Optimize numberbowling.vue
  - Clear timers/intervals properly
  - Batch localStorage operations
- [ ] Add lazy loading for routes
- [ ] Memoize expensive computations
- [ ] Optimize images (lazy load, compress)

## Testing
- [ ] Test backend query performance
- [ ] Test frontend rendering performance
- [ ] Monitor memory usage and leaks
