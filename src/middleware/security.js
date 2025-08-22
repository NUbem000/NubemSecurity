/**
 * Security Middleware for NubemSecurity
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cors from 'cors';
import crypto from 'crypto';

/**
 * Configure CORS with strict settings
 */
export const configureCors = () => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:8080'];

    return cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (Postman, curl, etc.)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        maxAge: 86400 // 24 hours
    });
};

/**
 * Configure Helmet for security headers
 */
export const configureHelmet = () => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    });
};

/**
 * Rate limiting configurations
 */
export const rateLimiters = {
    // General API rate limit
    general: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, // Return rate limit info in headers
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too many requests',
                message: 'You have exceeded the rate limit. Please try again later.',
                retryAfter: req.rateLimit.resetTime
            });
        }
    }),

    // Strict rate limit for auth endpoints
    auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per windowMs
        message: 'Too many authentication attempts, please try again later.',
        skipSuccessfulRequests: true // Don't count successful requests
    }),

    // Rate limit for query endpoints
    query: rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 20, // Limit each IP to 20 queries per minute
        message: 'Too many queries, please slow down.',
        keyGenerator: (req) => {
            // Use authenticated user ID if available, otherwise use IP
            return req.auth?.id || req.ip;
        },
        skip: (req) => {
            // Skip rate limiting for admin users
            return req.auth?.role === 'admin';
        }
    }),

    // Dynamic rate limiter based on user type
    dynamic: (req, res, next) => {
        let limit;
        
        if (req.auth?.type === 'jwt' && req.auth?.role === 'admin') {
            limit = 1000; // Admin users
        } else if (req.auth?.type === 'jwt') {
            limit = 200; // Authenticated users
        } else if (req.auth?.type === 'apikey') {
            limit = req.auth?.rateLimit || 100; // API key specific limit
        } else {
            limit = 50; // Anonymous users
        }

        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: limit,
            keyGenerator: (req) => req.auth?.id || req.ip
        });

        limiter(req, res, next);
    }
};

/**
 * Input validation and sanitization
 */
export const sanitization = {
    // Prevent NoSQL injection attacks
    mongoSanitize: mongoSanitize({
        replaceWith: '_'
    }),

    // Prevent XSS attacks
    xssClean: xss(),

    // Prevent HTTP Parameter Pollution
    hpp: hpp({
        whitelist: ['sort', 'fields', 'page', 'limit']
    })
};

/**
 * Custom security middleware
 */
export const customSecurity = {
    // Remove sensitive headers
    removeHeaders: (req, res, next) => {
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        next();
    },

    // Add security headers
    addSecurityHeaders: (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        next();
    },

    // Request ID for tracking
    requestId: (req, res, next) => {
        req.id = crypto.randomUUID();
        res.setHeader('X-Request-ID', req.id);
        next();
    }
};

/**
 * Apply all security middleware
 */
export const applySecurityMiddleware = (app) => {
    // Basic security
    app.use(customSecurity.removeHeaders);
    app.use(customSecurity.addSecurityHeaders);
    app.use(customSecurity.requestId);
    
    // Helmet for security headers
    app.use(configureHelmet());
    
    // CORS configuration
    app.use(configureCors());
    
    // Sanitization
    app.use(sanitization.mongoSanitize);
    app.use(sanitization.xssClean);
    app.use(sanitization.hpp);
    
    // General rate limiting
    app.use('/api/', rateLimiters.general);
    app.use('/auth/', rateLimiters.auth);
    
    console.log('✅ Security middleware applied');
};