import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import envConfig from '@/common/utils/config'
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = new DocumentBuilder()
    .setTitle('DATN - LevelUp API')
    .setDescription('API documentation for the LevelUp application')
    .setVersion('1.0')
    .addBearerAuth()
    // .addTag('dung')
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  })

  app.enableCors({
    origin: envConfig.FRONTEND_URL,
    credentials: true,
  })
  app.use(helmet())
  await app.listen(process.env.PORT ?? 4000, '0.0.0.0')
}
bootstrap()
