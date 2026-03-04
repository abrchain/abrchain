
## 📄 SECURITY.md

```markdown
# Security Policy for ABR Protocol

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 2.0.x   | ✅                |
| 1.0.x   | ❌ (End of life)  |

## Reporting a Vulnerability

We take the security of ABR Protocol seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Create a public GitHub issue for the vulnerability
- Discuss it in public forums
- Disclose it to anyone before we've had a chance to address it

### Please DO:

Email us at: **security@nairax.ng**

Include the following details:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to expect:

1. **Acknowledgment**: We'll acknowledge your email within 24 hours
2. **Investigation**: We'll investigate and validate the issue
3. **Fix development**: We'll develop and test a fix
4. **Release**: We'll release a security update
5. **Disclosure**: We'll coordinate public disclosure with you

## Responsible Disclosure Timeline

- **Day 0**: Report received
- **Day 1-7**: Investigation and validation
- **Day 8-30**: Fix development and testing
- **Day 31**: Release security update
- **Day 32+**: Public disclosure (if appropriate)

## Bug Bounty Program

We currently do not offer a bug bounty program, but we will publicly acknowledge security researchers who help us improve our security.

## Security Features

### Protocol Security

- **Immutable Genesis**: Genesis hash is permanently locked
- **105% Reserve Ratio**: Always over-collateralized
- **Multi-sig Wallets**: 3-of-5 signatures required
- **Oracle Verification**: 5 trusted oracles verify peg
- **Chain Halts**: If genesis hash changes, chain stops

### Network Security

- **Encrypted P2P**: All node communication is encrypted
- **Rate Limiting**: API rate limits prevent abuse
- **DDoS Protection**: Cloudflare protection enabled
- **Seed Nodes**: Redundant seed nodes across Africa

### Code Security

- Regular security audits
- Automated vulnerability scanning
- Dependency monitoring with Dependabot
- CodeQL analysis enabled

## Audit History

| Date | Auditor | Scope | Report |
|------|---------|-------|--------|
| 2026-01-15 | Trail of Bits | Core Protocol | [Link](audits/trail-of-bits-2026-01.pdf) |
| 2025-12-10 | Kudelski Security | Trading Engine | [Link](audits/kudelski-2025-12.pdf) |

## Known Security Issues

None at this time. All known issues have been patched.

## Contact

- **Security Team**: support@nairax.ng
- **PGP Key**: [Download](security/security.asc)
- **Key Fingerprint**: `3DA5 1579 9179 D2F8 BF0F BB86 167B EF33 2EA2 BBB9`

---

**Last Updated**: March 2026  
**Version**: 2.0.0  
**Genesis Hash**: 3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7
