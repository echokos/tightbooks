/**
 * Exports the OpenAPI document from the NestJS app to shared/sdk-ts/openapi.json.
 * Run from packages/server: pnpm run openapi:export
 */
/// <reference path="../src/common/types/Objection.d.ts" />
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClsMiddleware } from 'nestjs-cls';
import * as path from 'path';
import * as fs from 'fs';
import '@/utils/moment-mysql';
import { AppModule } from '@/modules/App/App.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function exportOpenApi() {
  global.__public_dirname = path.join(__dirname, '..', 'public');
  global.__static_dirname = path.join(__dirname, '..', 'static');
  global.__views_dirname = path.join(global.__static_dirname, '/views');
  global.__images_dirname = path.join(global.__static_dirname, '/images');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.set('query parser', 'extended');
  app.setGlobalPrefix('/api');
  app.use(new ClsMiddleware({}).use);

  const config = new DocumentBuilder()
    .setTitle('Bigcapital')
    .setDescription('Financial accounting software')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  await app.close();

  const outputPath = path.resolve(__dirname, '../../../shared/sdk-ts/openapi.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`OpenAPI spec written to ${outputPath}`);
}

exportOpenApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
