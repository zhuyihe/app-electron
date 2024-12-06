<template>
    <div class="printerConfig">
        <div class="printSet">
            <p>打印设置</p>
            <div>
                <!-- <div class="bgColor range">
                    <div class="printTitle">
                        <p class="left">选则打印范围</p>
                        <p>共{{ totalPage }}页</p>
                    </div>
                    <div class="con">
                        <el-radio-group v-model="printInfo.type" :disabled="canSelectRange">
                            <el-radio :label="1">当前文档</el-radio>
                            <el-radio :label="3">打印当前页（第{{ printCon.curtPage }}页）</el-radio>
                            <el-radio :label="4" :disabled="printCon.ctPrintHtml ? false : true"
                                >从当前行开始续打（{{ printCon.ctPrintDesc }}）</el-radio
                            >
                            <el-radio :label="5" class="range">指定页码范围</el-radio>
                            <el-input v-model="pageRange" placeholder="请输入页码" clearable></el-input>
                        </el-radio-group>
                        <p>范例：1-3 或 5-8</p>
                        <el-radio-group v-model="printInfo.type" :disabled="canSelectRange || canSelectAll">
                            <el-radio :label="6">打印全部{{ clickDocInfo.mrTypeRootName }}</el-radio>
                            <el-radio :label="7">打印所有住院病历</el-radio>
                        </el-radio-group>
                    </div>
                </div> -->
                <div class="bgColor printNum">
                    <p>选择打印机</p>
                    <div class="con">
                        <el-form
                            :model="printInfo"
                            :rules="rules"
                            ref="printInfo"
                            label-width="80px"
                            class="printInfo"
                            size="small"
                            label-position="left"
                        >
                            <el-form-item label="打印机" prop="machine">
                                <el-select v-model="printInfo.machine" placeholder="请选择" clearable>
                                    <el-option
                                        v-for="item in printerList"
                                        :key="item.displayName"
                                        :label="item.displayName"
                                        :value="item.displayName"
                                    >
                                        <span style="float: left">{{ item.displayName }}</span>
                                        <span style="float: right; color: #8492a6; font-size: 13px" v-if="item.isDefault">默认</span>
                                    </el-option>
                                </el-select>
                            </el-form-item>
                            <el-form-item label="打印份数" prop="num">
                                <el-input type="number" min="1" v-model="printInfo.num" placeholder="请输入份数" clearable></el-input>
                            </el-form-item>
                            <!-- <el-form-item class="twoSided">
                                <el-checkbox v-model="printInfo.autoPage" :disabled="[6, 7].includes(printInfo.type)"
                                    >双面打印（自动翻页）</el-checkbox
                                >
                            </el-form-item> -->
                        </el-form>
                    </div>
                </div>
                <div class="btnGroup">
                    <el-button @click="$emit('back')" size="small">返回</el-button>
                    <el-button type="primary" @click="sure" size="small">打印</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            printCon: {
                // 打印内容相关
                width: '',
                pagedirection: '',
                html: '',
                totalPage: 1,
                selectHtml: '',
                curtPage: 1,
                curtPageHtml: '',
                ctPrintDesc: '',
                ctPrintHtml: '',
                htmlArr: []
            },
            printInfo: {
                // 打印选项相关
                type: 1,
                machine: '',
                num: 1,
                autoPage: false, // 自动翻页
                handlePage: false, // 手动翻页
                auto: 0 // 0自动 1手动
            },
            printerList: [],
            totalPage: 1, // 要打印内容总共多少页
            pageRange: '', // 指定页码范围
            rules: {
                machine: [
                    {
                        required: true,
                        message: '请选择打印机',
                        trigger: 'blur'
                    }
                ],
                num: [
                    {
                        required: true,
                        message: '请输入打印份数',
                        trigger: 'blur'
                    }
                ]
            }
        }
    },
    mounted() {
        this.init()
    },
    methods: {
        init() {
            this.printerList = this.$electronStore.get('printList')
            console.log(this.printerList, 'this.printerList')
            this.printInfo.machine = this.printerList.filter(item => {
                return item.isDefault
            })[0].displayName
        },
        sure() {
            this.$refs.printInfo.validate(valid => {
                if (valid) {
                    this.$emit('sure', this.printInfo)
                } else {
                    return false
                }
            })
        }
    }
}
</script>

<style lang="scss">
.printerConfig {
    padding: 20px;
    font-size: 14px;
    // height: calc(100%);
    background-color: #fff;
    .printNum {
        margin: 10px 0;
        p {
            margin: 10px 0;
        }
    }

    .el-radio {
        margin-bottom: 15px;
    }

    .range {
        margin-right: 10px;
        margin-bottom: 5px;
    }

    .el-select {
        .el-input {
            width: 200px;
        }
    }

    .el-input {
        width: 130px;
    }
    .bgColor {
        background-color: #f2f2f2;
        padding: 10px 15px;
    }
    .printSet {
        padding-top: 10px;
        margin-left: 10px;
        width: 300px;
    }
    .btnGroup {
        text-align: right;
    }
}
</style>
