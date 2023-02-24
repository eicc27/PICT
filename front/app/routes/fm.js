import Route from "@ember/routing/route";
import { service } from "@ember/service";
import axios from "axios";

export default class FmRoute extends Route {
    @service fm;

    async model() {
        const that = this;
        const response = await axios.get("http://localhost:3000/fileManager");
        const data = response.data;
        that.fm.setTotal(data.total.pictures, data.total.illusts, data.selected);
        const responsePictures = await axios.get("http://localhost:3000/fileManager/all?limit=20&offset=0");
        const pictures = responsePictures.data.pictures;
        console.log(pictures);
        that.fm.addPictures(...pictures);
    }
}