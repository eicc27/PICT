import sharp from "sharp";
import { logfcall } from "./Logger.js";

export class Image {
    private image: sharp.Sharp;

    public constructor(img: string | Buffer) {
        this.image = sharp(img);
    }

    @logfcall() public async getSize() {
        const meta = await this.image.metadata();
        if (!meta.width || !meta.height) throw new EvalError('Cannot get width and height from image');
        return [meta.width, meta.height];
    }

    @logfcall() public async cropToFit(w: number, h: number, mode: 'center' | 'top' = 'center') {
        const size = await this.getSize();
        let left = 0;
        let top = 0;
        if (mode == 'center') {
            left = Math.floor((size[0] - w) / 2);
            top = Math.floor((size[1] - h) / 2);
        } else if (mode == 'top') {
            left = Math.floor((size[0] - w) / 2);
            top = 0;
        }
        return await this.image.extract({
            left: left,
            top: top,
            width: w,
            height: h
        }).toFormat('jpeg', { mozjpeg: true })
            .toBuffer();
    }

    @logfcall() public async resizeToFit(w?: number, h?: number) {
        return await this.image.resize({
            width: w,
            height: h,
            fit: "cover"
        }).toFormat('jpeg', { mozjpeg: true })
            .toBuffer();
    }
}