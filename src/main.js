import Vue from 'vue'
import App from './App.vue'
import router from './router'
// import store from './store'
import './plugins/element.js'
import inject from './plugins/inject.js'
import '@/assets/iconfont/iconfont.js'
// import VueSocketio from 'vue-socket.io'
// import socketio from 'socket.io-client'
Vue.config.productionTip = false
// const socketOptions = {
//     autoConnect: true // 自动连接     这里为我项目需求  需要在指定情况下才连接socket
// }
Vue.use(inject)

// Vue.use(
//     new VueSocketio({
//         debug: true, // debug调试，生产建议关闭
//         connection: socketio('http://localhost:5000', socketOptions),
//         reconnect: true //掉线后自动重连
//     })
// )
new Vue({
    // sockets: {
    //     connecting() {
    //         console.log('正在连接')
    //     },
    //     disconnect() {
    //         console.log('Socket 断开')
    //     },
    //     connect_failed() {
    //         console.log('连接失败')
    //     },
    //     connect() {
    //         console.log('serve socket connected')
    //     }
    // },
    router,
    // store,
    render: h => h(App)
}).$mount('#app')
