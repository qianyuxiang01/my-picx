import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	server: {
		port: 8990,
		host: "0.0.0.0",

		// TODO: 本地启动时的代理服务器，部署时需要去除
		// proxy: {
		// 	'/rest': {
		// 		target: 'https://my-picx.pages.dev',
		// 		changeOrigin: true
		// 	}
		// }
	}
})
