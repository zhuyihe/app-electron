const resStatus = (res, success, message) => {
    return res.status(200).json({
        code: 200,
        data: {
            success,
            message
            // win: global.electronStore.get('win')
        }
    })
}

module.exports = {
    resStatus
}
