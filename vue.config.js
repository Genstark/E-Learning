// vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // publicPath: '',
  configureWebpack: {
    plugins: [
      // Define Vue feature flags
      new (require('webpack')).DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false, // 👈 Add this
      }),
    ],
  }
})
