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
};

module.exports = nextConfig;
