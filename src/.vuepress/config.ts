module.exports = {
    head: [
        ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }],
        ['link', { rel: 'icon', href: '/logo.svg' }],
    ],
    title: '技术笔记',
    description: '技术笔记',
    theme: 'reco',
    themeConfig: {
        footer: false,
        subSidebar: 'auto',
        logo: '/logo.svg',
        mode: 'light',
        nav: [
            {text: '首页',link: '/'},
            {text: 'Java',link: '/java/'},
            {text: '数据库',link: '/sql/'},
        ],
        sidebar: {
            '/java/': [
                {
                    title: 'Java基础',
                    collapsable: false,
                    children: [
                        {
                            title: '面向对象',
                            path: '/java/'
                        }
                    ]
                },
                {
                    title: 'Java集合',
                    collapsable: false,
                    children: [
                        '/java/list',
                        '/java/queue',
                        '/java/map',
                        '/java/set',
                        '/java/fail'
                    ]
                }
            ],
            '/sql/': [
                {
                    title: 'Mysql基础',
                    collapsable: false,
                    children: [
                        {
                            title: 'DDL',
                            path: '/sql/'
                        }
                    ]
                },
                {
                    title: 'Mysql进阶',
                    collapsable: false,
                    children: [
                        {
                            title: 'DDM',
                            path: '/sql/test'
                        }
                    ]
                }
            ],

        }
    },
    plugins: [
        [
            '@renovamen/vuepress-plugin-mermaid'
        ]
    ]
}