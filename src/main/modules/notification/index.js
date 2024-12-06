const { Notification } = require('electron')
const path = require('path')
const notification = () => {
    return {
        notice: null,
        create(title = '标题', body = '正文文本，显示在标题下方') {
            const isSupported = Notification.isSupported()
            let notice = null

            if (this.notice) {
                this.close()
            }
            if (isSupported) {
                // console.log(path.join(__dirname, './logo.png'), 'aaaa')
                const options = {
                    title,
                    body,
                    silent: true,
                    icon: path.join(__dirname, './logo.png')
                }
                notice = new Notification(options)
            }
            notice.show()
            this.notice = notice
        },
        close() {
            this.notice.close()
        }
    }
}
global.$notification = notification()
module.exports = notification
