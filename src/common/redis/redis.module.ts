import { Global, Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import KeyvRedis from '@keyv/redis'
import { Keyv } from 'keyv'
import { KeyvCacheableMemory } from 'cacheable'

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
        console.log('Connecting to Redis:', redisUrl)
        return {
          stores: [
            new Keyv({
              store: new KeyvCacheableMemory({ ttl: 30_000, lruSize: 1000 }),
            }),
            new KeyvRedis(redisUrl),
          ],
        }
      },
    }),
  ],
})
export class RedisModule {}
