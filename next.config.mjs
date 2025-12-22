/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: [],
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
