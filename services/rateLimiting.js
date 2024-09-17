const Redis = require('ioredis');
const redis = new Redis();

const connectionLimit = 30;
const connectionWindowMs = 10 * 60 * 1000; // 10 minutes

const connectionLimiter = async (userId) => {
    const key = `connection:${userId}`;
    const currentCount = await redis.get(key);
    
    if (currentCount && parseInt(currentCount) >= connectionLimit) {
      return false; // Connection limit exceeded
    }

    console.log('connectionLimiter', userId, 'currentCount', currentCount);
  
    await redis.multi()
      .incr(key)
      .expire(key, connectionWindowMs / 1000)
      .exec();
    
    return true;
  };

const messageLimit = 20;
const messageWindowMs = 60 * 1000; // 1 minute

const messageLimiter = async (userId) => {
    const key = `message:${userId}`;
    const currentCount = await redis.get(key);

    if (currentCount && parseInt(currentCount) >= messageLimit) {
        return false; // Message limit exceeded
    }

    console.log('messageLimiter', userId, 'currentCount', currentCount);

    await redis.multi()
        .incr(key)
        .expire(key, messageWindowMs / 1000)
        .exec();

    return true;
};

module.exports = { connectionLimiter, messageLimiter };

