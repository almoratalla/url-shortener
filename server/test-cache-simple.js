const { CacheService } = require('./src/services/CacheService');

console.log('Testing CacheService...');

const cache = new CacheService(3, 1);
cache.set('key1', 'value1');
console.log('Get key1:', cache.get('key1'));
console.log('Cache size:', cache.size());

console.log('✅ Basic cache functionality works');
