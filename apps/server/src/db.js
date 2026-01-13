
// Use Redis if setup, otherwise fallback on local fs
if (!process.env.REDIS_URL || process.env.REDIS_URL.trim() === '') {
    const fs = require('node:fs').promises;

    const db = {
        filePath: 'users.db',

        read: async () => {
            try {
                const data = await fs.readFile(db.filePath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // File doesn't exist, return empty array
                    return [];
                }
                throw error;
            }
        },

        write: async (data) => {
            await fs.writeFile(db.filePath, JSON.stringify(data, null, 2));
        },

        findUser: async (email) => {
            const users = await db.read();
            return users.find(user => user.email === email);
        },

        addUser: async (email, workspaceName) => {
            const users = await db.read();

            // Check if user already exists
            if (users.some(user => user.email === email)) {
                throw new Error('Email already exists');
            }

            const newUser = {
                email,
                workspaceName
            };
            users.push(newUser);
            await db.write(users);
            return newUser;
        },

        updateUser: async (email, workspaceName) => {
            const users = await db.read();
            const userIndex = users.findIndex(user => user.email === email);
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            users[userIndex].workspaceName = workspaceName;
            await db.write(users);
            return users[userIndex];
        },

    };

    module.exports = {
        findUser: db.findUser,
        addUser: db.addUser,
        updateUser: db.updateUser,
    };
} else {
    const { createClient } = require('redis');

    const client = createClient({
        url: process.env.REDIS_URL
    });

    client.on('error', (err) => {
        console.log('Redis Client Error', err);
    });

    const ensureConnection = async () => {
        if (!client.isOpen) {
            await client.connect();
        }
    };

    const db = {
        findUser: async (email) => {
            await ensureConnection();
            const userData = await client.get(`user:${email}`);
            return userData ? JSON.parse(userData) : null;
        },

        addUser: async (email, workspaceName) => {
            await ensureConnection();
            const exists = await client.exists(`user:${email}`);
            if (exists) {
                throw new Error('Email already exists');
            }

            const user = {
                email,
                workspaceName,
                created_at: new Date().toISOString()
            };

            await client.set(`user:${email}`, JSON.stringify(user));
            return user;
        },

        updateUser: async (email, workspaceName) => {
            await ensureConnection();
            const userData = await client.get(`user:${email}`);
            if (!userData) {
                throw new Error('User not found');
            }
            const user = JSON.parse(userData);
            user.workspaceName = workspaceName;
            await client.set(`user:${email}`, JSON.stringify(user));
            return user;
        },
    };

    module.exports = {
        findUser: db.findUser,
        addUser: db.addUser,
        updateUser: db.updateUser,
    };
}
