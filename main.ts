//% weight=100 color="#31C48D" icon="\uf26c" block="OLED 增强版"
namespace OledPro {
    const OLED_ADDR = 0x3C;
    // 采用 Adafruit 核心思想：128x64 屏幕需要 1024 字节的显存
    // 数组第 0 位固定为 0x40 (I2C 数据命令)，后面 1024 位是屏幕数据
    let screenBuf = pins.createBuffer(1025);
    screenBuf[0] = 0x40; 
    let isInitialized = false;

    // --- 极简中文字库 (16x16点阵) ---
    // 这里采用字典映射，你可以无限往下加你的游戏道具和词汇
    const fontDict: { [key: string]: number[] } = {
        // "血" 的 16x16 点阵 (示例十六进制)
        "血": [0x04,0x04,0xFF,0x04,0x04,0x84,0x44,0x24,0x14,0x0C,0x04,0x04,0x04,0x04,0x00,0x00, 
               0x00,0x00,0xFF,0x00,0x00,0x01,0x02,0x0C,0x30,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
        // "量" 的 16x16 点阵 (示例十六进制)
        "量": [0x00,0xFE,0x22,0x22,0x22,0xFE,0x00,0xFE,0x92,0x92,0x92,0xFE,0x00,0x00,0x00,0x00, 
               0x04,0x0F,0x04,0x04,0x04,0xFF,0x04,0x04,0x04,0x04,0x04,0x0F,0x04,0x00,0x00,0x00],
        // 你后续可以通过取模软件把 "咖啡", "彩票", "酒吧" 的十六进制加在这里
    };

    function writeCmd(cmd: number) {
        let buf = pins.createBuffer(2);
        buf[0] = 0x00;
        buf[1] = cmd;
        pins.i2cWriteBuffer(OLED_ADDR, buf);
    }

    /**
     * 初始化 128x64 OLED 屏幕
     */
    //% block="初始化 OLED 屏幕"
    //% weight=100
    export function init(): void {
        if (isInitialized) return;
        writeCmd(0xAE); // 关闭显示
        writeCmd(0x20); // 寻址模式
        writeCmd(0x00); // 水平寻址模式 (关键！配合全局刷屏)
        writeCmd(0x21); // 设置列地址
        writeCmd(0x00); writeCmd(0x7F); // 0-127
        writeCmd(0x22); // 设置页地址
        writeCmd(0x00); writeCmd(0x07); // 0-7
        writeCmd(0x8D); writeCmd(0x14); // 开启电荷泵
        writeCmd(0xAF); // 开启显示
        clear();
        update();
        isInitialized = true;
    }

    /**
     * 清空内存缓冲区 (注意：需要调用更新屏幕才会生效)
     */
    //% block="清空缓冲区"
    //% weight=90
    export function clear(): void {
        for (let i = 1; i < 1025; i++) {
            screenBuf[i] = 0x00;
        }
    }

    /**
     * 将内存缓冲区的数据一次性推送到屏幕上
     */
    //% block="更新屏幕显示"
    //% weight=85
    export function update(): void {
        // 重置列和页地址指针
        writeCmd(0x21); writeCmd(0x00); writeCmd(0x7F);
        writeCmd(0x22); writeCmd(0x00); writeCmd(0x07);
        // 一次性发送 1024 字节数据，极致丝滑
        pins.i2cWriteBuffer(OLED_ADDR, screenBuf);
    }

    /**
     * 在指定坐标渲染一个汉字到缓冲区
     * @param text 要显示的单个汉字，例如 "血"
     * @param x 横坐标 (0-112)
     * @param y 纵坐标 (0-48)
     */
    //% block="在坐标 x %x y %y 写入汉字 %text"
    //% weight=80
    export function drawChineseChar(x: number, y: number, text: string): void {
        let fontData = fontDict[text];
        if (!fontData) return; // 如果字库里没有这个字，就跳过

        let page = Math.floor(y / 8);
        let bitOffset = y % 8;

        // 将 16x16 的点阵数据写入到全局缓冲区中
        for (let col = 0; col < 16; col++) {
            if (x + col > 127) break;
            
            // 写入上半部分
            if (page < 8) {
                let idx = 1 + (x + col) + page * 128;
                screenBuf[idx] |= (fontData[col] << bitOffset);
            }
            // 写入下半部分 (跨页处理)
            if (page + 1 < 8) {
                let idx2 = 1 + (x + col) + (page + 1) * 128;
                screenBuf[idx2] |= (fontData[col] >> (8 - bitOffset));
                screenBuf[idx2] |= (fontData[col + 16] << bitOffset);
            }
            // 处理可能的第三页跨越
            if (page + 2 < 8 && bitOffset > 0) {
                let idx3 = 1 + (x + col) + (page + 2) * 128;
                screenBuf[idx3] |= (fontData[col + 16] >> (8 - bitOffset));
            }
        }
    }
}
