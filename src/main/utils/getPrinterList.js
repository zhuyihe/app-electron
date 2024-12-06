export default async function getPrinterList(event) {
    const { sender } = event
    const list = await sender.getPrinters()
    // console.log(list, 'list')
    sender.send('getPrinterList', list)
}
