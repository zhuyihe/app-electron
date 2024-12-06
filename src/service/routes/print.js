const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const printModels = require('../models/print')
const vaildator = {
    emrContent: [
        body('FileFormat').notEmpty().withMessage('类型不能为空'),
        body('FileStream').notEmpty().withMessage('内容不能为空'),
        body('FileStream').isString().withMessage('内容必须为字符串')
    ],
    printPdf: [body('url').notEmpty().withMessage('pdf地址不能为空')]
}
router.post('/isGlprinterStarted', printModels.getPrinterStatred)
router.post('/emrContent', vaildator.emrContent, printModels.getEmrContent)
router.post('/printPdf', vaildator.emrContent, printModels.printPdf)
router.get('/getPrinters', printModels.getPrinters)
module.exports = router
