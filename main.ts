//% color="#31C48D" icon="\uf26c" block="OLED 中文显示"
namespace OledZh {
    // 基础 I2C 屏幕地址
    const OLED_ADDR = 0x3C;

    // 简易中文字体点阵示例（16x16 点阵）
    const font16 = [
        [0x00,0x00,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x10,0x00,0x00], // "一" 示例
    ];

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
        writeCmd(0xAE); // 关闭显示
        writeCmd(0x20); // 设置内存寻址模式
        writeCmd(0x02); // 页寻址
        writeCmd(0x8D); // 电荷泵设置
        writeCmd(0x14); // 开启电荷泵
        writeCmd(0xAF); // 开启显示
        clear();
    }

    /**
     * 清屏
     */
    //% block="清空屏幕"
    //% weight=90
    export function clear(): void {
        for (let page = 0; page < 8; page++) {
            writeCmd(0xB0 + page);
            writeCmd(0x00);
            writeCmd(0x10);
            let buf = pins.createBuffer(129);
            buf[0] = 0x40;
            pins.i2cWriteBuffer(OLED_ADDR, buf);
        }
    }

    /**
     * 在指定位置显示一个 16x16 的中文字符
     */
    //% block="在坐标 x %x|页 %page 显示汉字 编号 %charIndex"
    //% weight=80
    export function showChinese(x: number, page: number, charIndex: number): void {
        if (charIndex >= font16.length) return;
        
        // 绘制上半部分 (8像素高)
        writeCmd(0xB0 + page);
        writeCmd(x & 0x0F);
        writeCmd(0x10 | ((x >> 4) & 0x0F));
        let bufTop = pins.createBuffer(9);
        bufTop[0] = 0x40;
        for(let i=0; i<8; i++) {
            bufTop[i+1] = font16[charIndex][i];
        }
        pins.i2cWriteBuffer(OLED_ADDR, bufTop);

        // 绘制下半部分 (8像素高)
        writeCmd(0xB0 + page + 1);
        writeCmd(x & 0x0F);
        writeCmd(0x10 | ((x >> 4) & 0x0F));
        let bufBottom = pins.createBuffer(9);
        bufBottom[0] = 0x40;
        for(let i=0; i<8; i++) {
            bufBottom[i+1] = font16[charIndex][i+8];
        }
        pins.i2cWriteBuffer(OLED_ADDR, bufBottom);
    }
}
