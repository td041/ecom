import { Injectable } from '@nestjs/common'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { GoogleAuthStateType } from 'src/routes/auth/auth.model'
import envConfig from 'src/shared/config'

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI,
    )
  }
  getAuthorizationUrl({ userAgent, ip }: GoogleAuthStateType) {
    const scope = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
    const stateString = Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64')
    //Chuyển đổi Object thành chuỗi JSON và mã hóa nó thành string Base64 an toàn bỏ lên url
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      include_granted_scopes: true,
      state: stateString,
    })
    return { url }
  }
}
