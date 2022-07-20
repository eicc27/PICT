import Component from '@glimmer/component';
import { action } from '@ember/object';
import ENV from 'front/config/environment';

export default class DiamondComponent extends Component {
    canInteract(index) {
        // console.log(index);
        const diamondCount = document.getElementsByClassName('diamond').length;
        const activeDiamondCount =
            document.getElementsByClassName('diamond-focus').length;
        return (
            index < diamondCount &&
            index < activeDiamondCount &&
            !ENV.DOWNLOADING
        );
    }

    changeColor(diamondElement, color) {
        diamondElement.style.color = color;
        diamondElement.children[1].style.border = `2px solid ${color}`;
        diamondElement.children[2].style.background = color;
    }

    @action
    scaleUp(index) {
        index = parseInt(index);
        if (!this.canInteract(index)) return;
        const diamond = document.getElementById(`diamond-${index}`);
        diamond.style.cursor = 'pointer';
        diamond.style.transform = 'scale(1.2)';
        this.changeColor(diamond, 'orange');
        const activeDiamonds = document.getElementsByClassName('diamond-focus');
        const dashes = document
            .getElementsByClassName('steps')[0]
            .getElementsByClassName('line');
        for (let i = index + 1; i < activeDiamonds.length; i++) {
            dashes[i - 1].classList.remove('line-focus');
            this.changeColor(activeDiamonds[i], 'rgba(0, 0, 0, 50%)');
            activeDiamonds[i].getElementsByClassName(
                'cancel'
            )[0].style.display = 'block';
        }
    }

    @action
    scaleDown(index) {
        index = parseInt(index);
        if (!this.canInteract(index)) return;
        const diamond = document.getElementById(`diamond-${index}`);
        let color = 'rgba(0, 0, 0, 50%)'; // hsl not compatible
        if (diamond.className.includes('diamond-focus')) color = 'royalblue';
        diamond.style.transform = 'scale(1)';
        diamond.style.cursor = 'default';
        this.changeColor(diamond, color);
        const activeDiamonds = document.getElementsByClassName('diamond-focus');
        const dashes = document
            .getElementsByClassName('steps')[0]
            .getElementsByClassName('line');
        for (let i = index + 1; i < activeDiamonds.length; i++) {
            dashes[i - 1].classList.add('line-focus');
            this.changeColor(activeDiamonds[i], 'royalblue');
            activeDiamonds[i].getElementsByClassName(
                'cancel'
            )[0].style.display = 'none';
        }
    }

    @action
    show(index) {
        index = parseInt(index);
        if (!this.canInteract(index)) return;
        const diamonds = document.getElementsByClassName('diamond');
        const dashes = document
            .getElementsByClassName('steps')[0]
            .getElementsByClassName('line');
        // any block which is right to the index is gray
        // any connection dashes is gray
        for (let i = index + 1; i < diamonds.length; i++) {
            // console.log(i);
            diamonds[i].classList.remove('diamond-focus');
            this.changeColor(diamonds[i], 'rgba(0, 0, 0, 50%)');
            dashes[i - 1].classList.remove('line-focus');
            diamonds[i].getElementsByClassName('cancel')[0].style.display =
                'none';
        }
    }
}
