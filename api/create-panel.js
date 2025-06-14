// api/create-panel.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { username, plan, ram, disk, cpu } = req.body;

        // --- TAMBAHKAN BARIS DEBUGGING INI ---
        console.log('--- Checking Environment Variables ---');
        console.log('PTERO_EGG_ID:', process.env.PTERO_EGG_ID);
        console.log('PTERO_NEST_ID:', process.env.PTERO_NEST_ID);
        console.log('PTERO_LOCATION_ID:', process.env.PTERO_LOCATION_ID);
        console.log('PTERO_DOMAIN:', process.env.PTERO_DOMAIN);
        console.log('PTERO_API_KEY:', process.env.PTERO_API_KEY ? '****** (exists)' : '(missing/empty)');
        console.log('------------------------------------');
        // --- AKHIR BARIS DEBUGGING ---

        // Ambil Environment Variables dari Vercel
        const PTERO_EGG_ID = process.env.PTERO_EGG_ID;
        const PTERO_NEST_ID = process.env.PTERO_NEST_ID;
        const PTERO_LOCATION_ID = process.env.PTERO_LOCATION_ID;
        const PTERO_DOMAIN = process.env.PTERO_DOMAIN;
        const PTERO_API_KEY = process.env.PTERO_API_KEY;

        // Validasi keberadaan Environment Variables
        if (!PTERO_EGG_ID || !PTERO_NEST_ID || !PTERO_LOCATION_ID || !PTERO_DOMAIN || !PTERO_API_KEY) {
            throw new Error("Missing Pterodactyl API configuration in Environment Variables.");
        }

        // ... (kode selanjutnya tetap sama)
        // Fungsi bantu untuk membuat password acak
        function randomHex(len = 4) {
            let result = '';
            const characters = 'abcdef0123456789';
            for (let i = 0; i < len; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }

        // Fungsi bantu untuk mengkapitalisasi username
        function capitalizeUsername(user) {
            return user
                .split(/[\s-_]+/)
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }

        const panelUsername = username.toLowerCase();
        const email = panelUsername + "@gmail.com";
        const name = capitalizeUsername(panelUsername) + " Server";
        const password = panelUsername + randomHex(4); // Password dibuat di backend

        // --- Langkah 1: Buat User di Pterodactyl ---
        const userResponse = await fetch(`${PTERO_DOMAIN}/api/application/users`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${PTERO_API_KEY}`,
            },
            body: JSON.stringify({
                email: email,
                username: panelUsername,
                first_name: name,
                last_name: "Server",
                language: "en",
                password: password,
            }),
        });

        const userData = await userResponse.json();
        if (!userResponse.ok || userData.errors) {
            console.error('Error creating user:', userData.errors || userData);
            throw new Error(userData.errors?.[0]?.detail || 'Failed to create user on Pterodactyl.');
        }
        const user = userData.attributes;
        const usr_id = user.id;

        // --- Langkah 2: Ambil Startup Command Egg ---
        const eggResponse = await fetch(
            `${PTERO_DOMAIN}/api/application/nests/${PTERO_NEST_ID}/eggs/${PTERO_EGG_ID}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${PTERO_API_KEY}`,
                },
            }
        );

        const eggData = await eggResponse.json();
        if (!eggResponse.ok || eggData.errors) {
            console.error('Error fetching egg details:', eggData.errors || eggData);
            throw new Error(eggData.errors?.[0]?.detail || 'Failed to fetch egg details from Pterodactyl.');
        }
        const startup_cmd = eggData.attributes.startup;

        // --- Langkah 3: Buat Server di Pterodactyl ---
        const serverResponse = await fetch(`${PTERO_DOMAIN}/api/application/servers`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${PTERO_API_KEY}`,
            },
            body: JSON.stringify({
                name: name,
                description: `Created on ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
                user: usr_id,
                egg: parseInt(PTERO_EGG_ID),
                docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
                startup: startup_cmd,
                environment: {
                    INST: "npm",
                    USER_UPLOAD: "0",
                    AUTO_UPDATE: "0",
                    CMD_RUN: "npm start",
                },
                limits: {
                    memory: parseInt(ram),
                    swap: 0,
                    disk: parseInt(disk),
                    io: 500,
                    cpu: parseInt(cpu),
                },
                feature_limits: {
                    databases: 5,
                    backups: 5,
                    allocations: 5,
                },
                deploy: {
                    locations: [parseInt(PTERO_LOCATION_ID)],
                    dedicated_ip: false,
                    port_range: [],
                },
            }),
        });

        const serverData = await serverResponse.json();
        if (!serverResponse.ok || serverData.errors) {
            console.error('Error creating server:', serverData.errors || serverData);
            throw new Error(serverData.errors?.[0]?.detail || 'Failed to create server on Pterodactyl.');
        }
        const server = serverData.attributes;

        // Kirim respons sukses ke frontend
        res.status(200).json({
            message: "Panel Created Successfully!",
            server_id: server.id,
            username: user.username,
            password: password, // Kirim password balik ke frontend untuk ditampilkan
            panel_host: PTERO_DOMAIN
        });

    } catch (error) {
        console.error('Serverless Function Error:', error);
        res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
    }
};
