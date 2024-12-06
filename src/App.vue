<template>
    <div id="app">
        <router-view />
    </div>
</template>
<script>
// import { ipcRenderer } from 'electron'
// import printDialog from './components/PrintDialog.vue'
// import PinterWeb from '@/components/PinterWeb.vue'
export default {
    name: 'App',
    components: {
        // PinterWeb
        // printDialog
    },
    data() {
        return {
            // dialogVisible: false,
            // HtmlData: '',
            // printList: [],
            // tableData: []
        }
    },
    mounted() {
    
    },
    methods: {
        // handlePrintDialogCancel() {
        //     this.dialogVisible = false
        // },
        // doPrint(row) {
        //     this.HtmlData = row.name
        //     this.$refs.print.print(row.name)
        // }
    }
}
</script>

<style>
body {
    margin: 0;
}
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    /* -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50; */
    /* margin-top: 60px; */
}
</style>
