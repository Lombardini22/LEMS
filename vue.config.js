module.exports = {
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: '/src/service-worker.js',
    },
    name: 'CP 2022',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'green',
  },
}
