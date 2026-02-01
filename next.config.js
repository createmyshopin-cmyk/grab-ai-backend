/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/9003',
                destination: '/',
                permanent: false,
            },
        ];
    },
    // Empty turbopack config to silence error (Next.js 16 uses Turbopack by default)
    turbopack: {},
};

module.exports = nextConfig;
