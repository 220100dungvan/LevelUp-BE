import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'

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
    origin: 'http://localhost:3000',
    credentials: true,
  })
  await app.listen(process.env.PORT ?? 4000)
}
bootstrap()
