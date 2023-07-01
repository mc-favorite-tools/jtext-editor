import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import styleImport from 'vite-plugin-style-import'
import cdnImport from 'vite-plugin-cdn-import'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    css: {
        preprocessorOptions: {
            less: { javascriptEnabled: true }
        }
    },
    build: {
        assetsDir: './'
    },
    plugins: [
        react(),
        // cdnImport({
        //     modules: [
        //         {
        //             name: 'react',
        //             var: 'React',
        //             path: 'https://unpkg.com/react@18.0.0/umd/react.production.min.js',
        //         },
        //         {
        //             name: 'react-dom',
        //             var: 'ReactDOM',
        //             path: 'https://unpkg.com/react-dom@18.0.0/umd/react-dom.production.min.js',
        //         },
        //         {
        //             name: '@ant-design/icons',
        //             var: 'icons',
        //             path: 'https://unpkg.com/@ant-design/icons@4.7.0/dist/index.umd.js',
        //         },
        //         {
        //             name: 'antd',
        //             var: 'antd',
        //             path: 'https://unpkg.com/antd@4.21.0/dist/antd.min.js',
        //             css: 'https://unpkg.com/antd@4.21.0/dist/antd.min.css',
        //         },
        //         {
        //             name: 'clsx',
        //             var: 'clsx',
        //             path: 'https://unpkg.com/clsx@1.2.1/dist/clsx.min.js',
        //         },
        //         {
        //             name: 'idbKeyval',
        //             var: 'idbKeyval',
        //             path: 'https://unpkg.com/idb-keyval@6.2.0/dist/umd.js',
        //         },
        //         {
        //             name: 'dayjs',
        //             var: 'dayjs',
        //             path: 'https://unpkg.com/dayjs@1.11.3/dayjs.min.js',
        //         }
        //     ]
        // }),
        // styleImport({
        //   libs: [
        //     {
        //       libraryName: 'antd',
        //       esModule: true,
        //       resolveStyle: (name) => {
        //         return `antd/es/${name}/style/index`
        //       },
        //     },
        //   ]
        // })
    ]
})
