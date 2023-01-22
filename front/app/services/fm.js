import Service from '@ember/service';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';

function buf2ab(buffer) {
    const ab = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer[i];
    }
    return view;
}

export default class FmService extends Service {
    @tracked totalIllusts = 0;
    @tracked totalPictures = 0;
    @tracked selectedPicture = '';

    @tracked pictures = A([]);

    setTotal(pictures, illusts, selected) {
        this.totalIllusts = illusts;
        this.totalPictures = pictures;
        const data = selected.data;
        this.selectedPicture = window.URL.createObjectURL(new Blob([buf2ab(data)], { type: 'image/png' }));
    }

    addPictures(...pictures) {
        for (const picture of pictures) {
            this.pictures.pushObject({
                pid: picture.pid,
                illust: picture.illust,
                title: picture.title,
                url: window.URL.createObjectURL(new Blob([buf2ab(picture.image.data)], { type: 'image/png' })),
            });
        }
    }
}
