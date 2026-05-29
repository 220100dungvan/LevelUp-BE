import envConfig from '@/common/utils/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import * as admin from 'firebase-admin'

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: envConfig.FIREBASE_PROJECT_ID,
          privateKey: envConfig.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
        }),
      })
    }
  }

  getAppCheck(): admin.appCheck.AppCheck {
    return admin.appCheck()
  }
}
