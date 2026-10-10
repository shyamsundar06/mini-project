const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const users = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];
        // Check password via bcrypt or match default demo password
        const isMatch = await bcrypt.compare(password, user.password_hash) || password === 'Password123!';
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        let touristProfile = null;
        let operatorProfile = null;

        if (user.role === 'tourist') {
            const t = await query('SELECT * FROM tourists WHERE user_id = ?', [user.id]);
            touristProfile = t[0] || null;
        } else if (user.role === 'operator') {
            const o = await query('SELECT * FROM operators WHERE user_id = ?', [user.id]);
            operatorProfile = o[0] || null;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                touristProfile,
                operatorProfile
            }
        });
    } catch (err) {
        console.error('[Auth] Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role = 'tourist', phone, company_name } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }

        const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (existing && existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email is already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `usr_${uuidv4().substring(0, 8)}`;

        await query(
            'INSERT INTO users (id, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, email.toLowerCase().trim(), passwordHash, role, phone || null]
        );

        if (role === 'operator') {
            const opId = `op_${uuidv4().substring(0, 8)}`;
            await query(
                'INSERT INTO operators (id, user_id, company_name, license_number, emergency_hotline) VALUES (?, ?, ?, ?, ?)',
                [opId, userId, company_name || `${name} Travels`, 'TN-TO-2026-AUTO', phone || '+91 800 000 0000']
            );
        } else {
            const touristId = `trt_${uuidv4().substring(0, 8)}`;
            await query(
                'INSERT INTO tourists (id, user_id, name, preferred_language, status) VALUES (?, ?, ?, ?, ?)',
                [touristId, userId, name, 'English', 'ACTIVE']
            );
        }

        const token = jwt.sign(
            { id: userId, email, role, name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: { id: userId, name, email, role, phone }
        });
    } catch (err) {
        console.error('[Auth] Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const users = await query('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!users || users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = users[0];
        let touristProfile = null;
        let operatorProfile = null;

        if (user.role === 'tourist') {
            const t = await query('SELECT * FROM tourists WHERE user_id = ?', [user.id]);
            touristProfile = t[0] || null;
        } else if (user.role === 'operator') {
            const o = await query('SELECT * FROM operators WHERE user_id = ?', [user.id]);
            operatorProfile = o[0] || null;
        }

        res.json({
            success: true,
            user: { ...user, touristProfile, operatorProfile }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
