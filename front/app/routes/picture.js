import Route from '@ember/routing/route';
import { service } from '@ember/service';
import axios from 'axios';

export default class PictureRoute extends Route {
    @service picture;

    async model(params) {
        const response = await axios.get(`http://localhost:3000/picture/${params.pid}`);
        this.picture.setPictureData(response.data);
    }
}