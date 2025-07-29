import { Body, Button, Container, Head, Heading, Html, Img, Link, Section, Text } from '@react-email/components'
import * as React from 'react'

interface OTPEmailProps {
  otpCode: string
  title: string
  userEmail: string
}

const logoUrl =
  'https://lh3.googleusercontent.com/-ddmDdrAz5qI/AAAAAAAAAAI/AAAAAAAAAAA/ALKGfkliLrF4NWRwNBEUXzmQiNm4Pb37dg/photo.jpg?sz=46'
const facebookIcon =
  'https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661502815169_682499/email-template-icon-facebook'
const instagramIcon =
  'https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661504218208_684135/email-template-icon-instagram'

export const OTPEmail = ({ otpCode, title, userEmail }: OTPEmailProps) => (
  <Html>
    <Head>
      <title>{title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
    </Head>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src={logoUrl} width="72" height="72" alt="Logo" style={logo} />
        </Section>
        <Section style={content}>
          <Heading style={heading}>Xác nhận mã OTP của bạn</Heading>
          <Text style={greeting}>
            Xin chào, <b>{userEmail}</b>
          </Text>
          <Text style={paragraph}>
            Vui lòng sử dụng mã OTP bên dưới để hoàn tất quá trình xác thực. Mã OTP này
            <strong> có hiệu lực trong 5 phút</strong>. Không chia sẻ mã với bất kỳ ai vì lí do bảo mật.
          </Text>
          <Section style={codeContainer}>
            <Text style={code}>{otpCode}</Text>
          </Section>
          <Button href="#" style={ctaButton}>
            Xác nhận ngay
          </Button>
        </Section>
        <Text style={supportText}>
          Nếu bạn cần hỗ trợ, vui lòng liên hệ
          <Link href="mailto:mycompany@gmail.com" style={supportLink}>
            mycompany@gmail.com
          </Link>
          hoặc truy cập Trung tâm hỗ trợ của chúng tôi.
        </Text>
        <Section style={footer}>
          <Section style={socialIcons}>
            <Link href="https://www.facebook.com/tttt.duc041/" style={socialButton}>
              <Img src={facebookIcon} width="32" height="32" alt="Facebook" />
            </Link>
            <Link href="https://www.instagram.com/twduck.04/" style={socialButton}>
              <Img src={instagramIcon} width="32" height="32" alt="Instagram" />
            </Link>
          </Section>
          <Text style={footerText}>© 2025 Công ty. Đã đăng ký bản quyền.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

OTPEmail.PreviewProps = {
  otpCode: '144833',
  title: 'Mã OTP',
  userEmail: 'user@example.com',
} as OTPEmailProps

export default OTPEmail

// Styles
const main = {
  margin: 0,
  fontFamily: "'Poppins', sans-serif",
  background: '#f8fafc',
  fontSize: '15px',
  color: '#292929',
  padding: 0,
}
const container = {
  maxWidth: '520px',
  margin: '32px auto',
  background: '#fff',
  borderRadius: '24px',
  boxShadow: '0 4px 28px 6px rgba(36,99,235,0.06)',
  overflow: 'hidden',
}
const headerSection = {
  background: 'linear-gradient(90deg, #6ab7f5 0%, #a78bfa 100%)',
  textAlign: 'center',
  padding: '28px 0 18px',
}
const logo = {
  display: 'inline-block',
  borderRadius: '100%',
  border: '2px solid #e0e7ff',
  background: '#fff',
}
const content = {
  textAlign: 'center',
  padding: '30px 24px 14px',
}
const heading = {
  fontSize: '21px',
  fontWeight: 600,
  margin: 0,
  marginBottom: '18px',
  letterSpacing: '1.5px',
  color: '#174ea6',
}
const greeting = {
  fontSize: '16px',
  fontWeight: 500,
  margin: '0 0 10px 0',
}
const paragraph = {
  fontSize: '15px',
  margin: 0,
  marginBottom: '34px',
  color: '#434343',
}
const codeContainer = {
  background: 'linear-gradient(90deg, #e0e7ff 0%, #c3dafe 100%)',
  borderRadius: '10px',
  margin: '18px auto',
  width: '182px',
  padding: '12px 0',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,.08)',
}
const code = {
  fontSize: '33px',
  fontWeight: 700,
  letterSpacing: '9px',
  color: '#e6426e',
  margin: 0,
}
const ctaButton = {
  marginTop: '22px',
  display: 'inline-block',
  padding: '12px 36px',
  borderRadius: '20px',
  fontWeight: 600,
  fontSize: '15px',
  background: 'linear-gradient(90deg, #6ab7f5 0%, #a78bfa 100%)',
  color: '#fff',
  textDecoration: 'none',
  outline: 'none',
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.23s',
}
const supportText = {
  maxWidth: '440px',
  margin: '28px auto 0',
  fontSize: '13px',
  textAlign: 'center',
  color: '#8c8c8c',
  fontWeight: 500,
}
const supportLink = { color: '#499fb6', textDecoration: 'underline' }
const footer = {
  width: '100%',
  margin: '23px auto 0',
  textAlign: 'center',
  borderTop: '1px solid #e6ebf1',
  paddingTop: '18px',
  background: '#fff',
}
const socialIcons = {
  marginBottom: '4px',
}
const socialButton = { display: 'inline-block', margin: '0 8px' }
const footerText = {
  fontSize: '12px',
  marginTop: '17px',
  color: '#b0b3ba',
}
