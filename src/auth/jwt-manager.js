/**
 * JWT Authentication Manager for NubemSecurity
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class JWTManager {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
        this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');
        this.ACCESS_TOKEN_EXPIRY = '15m';
        this.REFRESH_TOKEN_EXPIRY = '7d';
        
        // Demo users - in production, use database
        this.users = new Map([
            ['admin', {
                id: 'usr_001',
                username: 'admin',
                password: bcrypt.hashSync('NubemSec2025!', 10),
                role: 'admin',
                permissions: ['read', 'write', 'admin']
            }],
            ['analyst', {
                id: 'usr_002', 
                username: 'analyst',
                password: bcrypt.hashSync('Analyst2025!', 10),
                role: 'analyst',
                permissions: ['read']
            }]
        ]);
        
        this.apiKeys = new Map([
            ['nsk_demo_key_2025', {
                id: 'api_001',
                name: 'Demo API Key',
                permissions: ['read'],
                rateLimit: 100
            }]
        ]);
    }

    /**
     * Generate access token
     */
    generateAccessToken(user) {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                permissions: user.permissions
            },
            this.JWT_SECRET,
            { expiresIn: this.ACCESS_TOKEN_EXPIRY }
        );
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(user) {
        return jwt.sign(
            { id: user.id },
            this.JWT_REFRESH_SECRET,
            { expiresIn: this.REFRESH_TOKEN_EXPIRY }
        );
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.JWT_REFRESH_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    /**
     * Authenticate user with credentials
     */
    async authenticateUser(username, password) {
        const user = this.users.get(username);
        
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user),
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                permissions: user.permissions
            }
        };
    }

    /**
     * Validate API key
     */
    validateApiKey(apiKey) {
        const keyData = this.apiKeys.get(apiKey);
        
        if (!keyData) {
            throw new Error('Invalid API key');
        }

        return keyData;
    }

    /**
     * Middleware for JWT authentication
     */
    authMiddleware(requiredPermissions = []) {
        return async (req, res, next) => {
            try {
                // Check for API key first
                const apiKey = req.headers['x-api-key'];
                if (apiKey) {
                    const keyData = this.validateApiKey(apiKey);
                    req.auth = {
                        type: 'apikey',
                        ...keyData
                    };
                    
                    // Check permissions
                    if (requiredPermissions.length > 0) {
                        const hasPermission = requiredPermissions.some(perm => 
                            keyData.permissions.includes(perm)
                        );
                        
                        if (!hasPermission) {
                            return res.status(403).json({ error: 'Insufficient permissions' });
                        }
                    }
                    
                    return next();
                }

                // Check for Bearer token
                const authHeader = req.headers.authorization;
                
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({ error: 'No token provided' });
                }

                const token = authHeader.substring(7);
                const decoded = this.verifyAccessToken(token);
                
                req.auth = {
                    type: 'jwt',
                    ...decoded
                };

                // Check permissions
                if (requiredPermissions.length > 0) {
                    const hasPermission = requiredPermissions.some(perm => 
                        decoded.permissions.includes(perm)
                    );
                    
                    if (!hasPermission) {
                        return res.status(403).json({ error: 'Insufficient permissions' });
                    }
                }

                next();
            } catch (error) {
                return res.status(401).json({ error: error.message });
            }
        };
    }

    /**
     * Optional auth middleware - allows anonymous access
     */
    optionalAuthMiddleware() {
        return async (req, res, next) => {
            try {
                const apiKey = req.headers['x-api-key'];
                const authHeader = req.headers.authorization;

                if (apiKey) {
                    const keyData = this.validateApiKey(apiKey);
                    req.auth = {
                        type: 'apikey',
                        ...keyData
                    };
                } else if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    const decoded = this.verifyAccessToken(token);
                    req.auth = {
                        type: 'jwt',
                        ...decoded
                    };
                } else {
                    req.auth = {
                        type: 'anonymous',
                        permissions: []
                    };
                }

                next();
            } catch (error) {
                // Continue as anonymous if token is invalid
                req.auth = {
                    type: 'anonymous',
                    permissions: []
                };
                next();
            }
        };
    }
}

export default new JWTManager();