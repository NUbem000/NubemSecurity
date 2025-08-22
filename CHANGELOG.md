# Changelog

All notable changes to NubemSecurity will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-22

### Added
- Initial production-ready release
- JWT authentication system with refresh tokens
- API key authentication support
- Multi-level rate limiting (general, auth, queries, admin)
- Comprehensive security middleware (Helmet, CORS, XSS protection)
- Input validation with Zod schemas
- SQL injection and NoSQL injection prevention
- Enhanced vector store with Pinecone/ChromaDB/Memory support
- RAG (Retrieval Augmented Generation) system
- Integration with 50+ cybersecurity tools
- Multi-mode CLI (interactive, server, web)
- Production REST API with full documentation
- Comprehensive test suite with Jest
- CI/CD pipeline with Cloud Build
- Google Cloud Run deployment
- Docker multi-stage builds
- Health checks and monitoring
- Structured logging
- Request ID tracking
- Graceful shutdown handling

### Security
- Implemented JWT with RS256 algorithm
- Added bcrypt for password hashing
- Configured CSP (Content Security Policy)
- Added HSTS headers
- Implemented rate limiting per endpoint
- Added input sanitization
- Configured secure CORS policy

### Documentation
- Added comprehensive README
- Created CLI usage guide
- Generated security audit reports
- Added API documentation
- Created deployment guides

## [0.1.0] - 2025-08-21

### Added
- Initial fork from KaliGPT
- Basic CLI interface
- Support for multiple AI providers (OpenAI, Gemini, Grok, DeepSeek)
- Interactive chat mode
- Basic security tools integration
- Environment configuration

---

## Upcoming Features (v1.1.0)

### Planned
- [ ] Pinecone production integration
- [ ] Admin dashboard
- [ ] Advanced threat intelligence
- [ ] SIEM integration
- [ ] SSO/SAML support
- [ ] Audit logging
- [ ] Automated vulnerability scanning
- [ ] Custom model training
- [ ] On-premise deployment option