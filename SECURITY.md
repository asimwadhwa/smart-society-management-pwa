# Security Policy

## 🔒 Reporting a Vulnerability

We take the security of Rajarshi Darshan Society Management seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### ⚠️ Please Do NOT

- Open a public GitHub issue for security vulnerabilities
- Post about the vulnerability on social media
- Exploit the vulnerability beyond what is necessary to demonstrate it

### ✅ Please DO

1. **Email the maintainer directly** at: aayushvaghela12@gmail.com
2. **Include in your report**:
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Allow time** for us to investigate and patch

### ⏱️ Response Timeline

| Phase | Timeline |
|-------|----------|
| Initial Response | Within 48 hours |
| Vulnerability Assessment | Within 1 week |
| Patch Development | Within 2 weeks |
| Public Disclosure | After patch release |

## 🛡️ Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅ Yes |
| < 1.0   | ❌ No |

## 🔐 Security Measures Implemented

This project implements multiple security measures:

### Authentication & Authorization

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with 10 salt rounds |
| Session Management | JWT with httpOnly cookies |
| Token Expiry | 7 days with refresh mechanism |
| Role-Based Access | Manager, Admin, Resident, Watchman |
| OTP Verification | Email-based password reset |

### API Security

| Feature | Implementation |
|---------|----------------|
| CORS | Whitelisted origins only |
| Helmet | Security headers enabled |
| Rate Limiting | Auth endpoints protected |
| Input Validation | express-validator |
| Error Handling | Sanitized error messages |

### Data Security

| Feature | Implementation |
|---------|----------------|
| Database | MongoDB Atlas with encryption |
| Secrets | Environment variables |
| Cookies | httpOnly, Secure, SameSite |
| Uploads | ImageKit CDN with validation |

### Payment Security

| Feature | Implementation |
|---------|----------------|
| Gateway | Razorpay PCI DSS compliant |
| Verification | Webhook signature validation |
| Logs | Payment audit trail |

## 🔍 Security Checklist for Contributors

When contributing, ensure:

- [ ] No secrets/credentials in code
- [ ] Input validation on all user inputs
- [ ] Parameterized database queries
- [ ] Proper error handling (no stack traces in production)
- [ ] Authentication on protected routes
- [ ] Authorization checks for role-based access
- [ ] HTTPS only in production

## 📋 Known Security Considerations

### Environment Variables

Ensure these are NEVER committed to version control:

```
MONGODB_URI
JWT_SECRET
RAZORPAY_KEY_SECRET
BREVO_API_KEY
IMAGEKIT_PRIVATE_KEY
```

### MongoDB Atlas

- Enable IP whitelisting
- Use strong database user passwords
- Enable audit logging
- Regular backups enabled

### Production Deployment

- [ ] NODE_ENV=production
- [ ] Debug mode disabled
- [ ] CORS configured for production URLs
- [ ] SSL/TLS certificates valid
- [ ] Security headers enabled

## 🔄 Security Updates

We regularly update dependencies to patch known vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix
```

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## 🏆 Acknowledgments

We thank the following for responsibly disclosing vulnerabilities:

- *No reports yet*

---

Thank you for helping keep Rajarshi Darshan Society Management and its users safe!
