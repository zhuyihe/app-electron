<template>
    <div class="printPdf">
        <!-- <webview src="https://10.102.11.81/outp/2022-08-22/b1c800cb0000980a/b1c800cb0000980a_20220822161059_page_0.pdf"></webview> -->
        <!-- <iframe src="https://10.102.11.81/outp/2022-08-22/b1c800cb0000980a/b1c800cb0000980a_20220822161059_page_0.pdf" /> -->
        <el-button @click="back" size="small">返回</el-button>
    </div>
</template>

<script>
//main.js 远程pdf文件打印

// let NodePdfPrinter = require('node-pdf-printer')
export default {
    created() {
        this.init()
    },
    methods: {
        init() {
            let url = this.$electronStore.get('pdf')
            console.log(url, 'ccc')
            // NodePdfPrinter.printFiles([url1,url2,...],'你的打印机名字，不填/默认')
        },
        back() {
            this.$router.push('/')
        }
    }
}
</script>

<style></style>
