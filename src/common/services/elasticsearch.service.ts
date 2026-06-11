import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Client } from '@elastic/elasticsearch'
import envConfig from '@/common/utils/config'

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name)
  readonly client: Client

  constructor() {
    this.client = new Client({
      node: envConfig.ELASTICSEARCH_URL,
      ...(envConfig.ELASTICSEARCH_USERNAME && envConfig.ELASTICSEARCH_PASSWORD
        ? {
            auth: {
              username: envConfig.ELASTICSEARCH_USERNAME,
              password: envConfig.ELASTICSEARCH_PASSWORD,
            },
          }
        : {}),
    })
  }

  async onModuleInit() {
    try {
      const info = await this.client.info()
      this.logger.log(`Elasticsearch connected: ${info.version.number}`)
    } catch (err) {
      this.logger.warn(`Elasticsearch not available: ${(err as Error).message}`)
    }
  }

  /** Ping to check connectivity */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.ping()
      return true
    } catch {
      return false
    }
  }
}
