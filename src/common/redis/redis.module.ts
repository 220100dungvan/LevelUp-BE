import { Global, Module } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import KeyvRedis from '@keyv/redis'
import { Keyv } from 'keyv'
import { KeyvCacheableMemory } from 'cacheable'
import envConfig from '@/common/utils/config'

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [
          // L1: In-memory
          new Keyv({
            store: new KeyvCacheableMemory({ ttl: 30_000, lruSize: 1000 }),
          }),
          // L2: Redis (persist, share giữa các instance)
          new KeyvRedis(envConfig.REDIS_URL),
        ],
      }),
    }),
  ],
})
export class RedisModule {}
