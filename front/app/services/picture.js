import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

function buf2ab(buffer) {
    const ab = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; i++) {
        view[i] = buffer[i];
    }
    return view;
}

export default class PictureService extends Service {
    @tracked title = '';
    @tracked name = '';
    @tracked illust = '';
    @tracked illustId = '';
    @tracked time = '';
    @tracked views = '';
    @tracked tags = A([]);
    @tracked indexes = A([]);
    @tracked urls = A([]);

    setPictureData(pictureData) {
        this.title = pictureData.title;
        this.name = pictureData.name;
        this.illust = pictureData.illust;
        this.illustId = pictureData.illustId;
        this.time = pictureData.time;
        this.views = pictureData.views;
        this.tags = pictureData.tags;
        this.indexes.pushObjects(pictureData.indexes);
        for (let i = 0; i < this.indexes.length; i++) {
            this.urls.pushObject(null);
        }
    }

    setPictureUrl(index, data) {
        console.log(data);
        const url = window.URL.createObjectURL(new Blob([buf2ab(data.data)], { type: 'image/png' }));
        this.urls.set(index, url);
        this.urls = [...this.urls];
    }

    findIndex(index) {
        return this.indexes.findIndex((idx) => idx == index);
    }
}