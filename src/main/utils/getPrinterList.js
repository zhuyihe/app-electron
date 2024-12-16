export default async function getPrinterList(event) {
    const { sender } = event
    const list = await sender.getPrintersAsync()
    // console.log(list, 'list')
    sender.send('getPrinterList', list)
}
