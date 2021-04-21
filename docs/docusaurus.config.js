module.exports = {
    title: 'relational-schema',
    tagline: 'A Javascript schema generator for relational databases',
    url: 'https://mattgson.github.io',
    baseUrl: '/relational-schema/',
    onBrokenLinks: 'throw',
    favicon: 'img/favicon.ico',
    organizationName: 'MattGson', // Usually your GitHub org/user name.
    projectName: 'relational-schema', // Usually your repo name.
    themeConfig: {
        prism: {
            theme: require('prism-react-renderer/themes/dracula'),
        },
        navbar: {
            title: 'relational-schema',
            // logo: {
            //     alt: 'My Site Logo',
            //     src: 'img/relational-schema-logo.png',
            // },
            items: [
                {
                    to: 'docs/',
                    activeBasePath: 'docs',
                    label: 'Docs',
                    position: 'left',
                },
                {
                    href: 'https://github.com/MattGson/relational-schema',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            label: 'Introduction',
                            to: 'docs/',
                        },
                        {
                            label: 'Getting started',
                            to: 'docs/installation/',
                        },
                    ],
                },
                {
                    title: 'Community',
                    items: [
                        {
                            label: 'Stack Overflow',
                            href: 'https://stackoverflow.com/questions/tagged/relational-schema',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Matt Goodson`,
        },
    },
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    // It is recommended to set document id as docs home page (`docs/` path).
                    homePageId: 'introduction',
                    sidebarPath: require.resolve('./sidebars.js'),
                    // Please change this to your repo.
                    editUrl: 'https://github.com/MattGson/relational-schema/docs',
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            },
        ],
    ],
};
