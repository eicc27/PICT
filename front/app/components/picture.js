import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import axios from 'axios';
import ENV from 'front/config/environment';


export default class PictureComponent extends Component {
    @service picture;

    @action loadPicture() {
        const pid = window.location.pathname.split('/').pop();
        const that = this;
        const index = that.picture.indexes[0];
        axios.get(`http://localhost:3000/picture/${pid}?index=${index}`).then(function (response) {
            const data = response.data;
            that.picture.setPictureUrl(that.picture.findIndex(index), data.picture);
        });
    }
}