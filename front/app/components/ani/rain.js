import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class AniRainComponent extends Component {
    @tracked raindrops = [0, 1, 2];
    @tracked hint = false;

    /** @param {number} index */
    @action
    randomPosition(index) {
        console.log(`[fcall] randomPosition(${index})`);
        /** @type {(number, number) => number[]} clipRange */
        const clipRange = (value, ratio) => {
            const whitespace = (value * (1 - ratio)) / 2;
            return [whitespace, value - whitespace];
        };
        /** @type {(number, number) => number} randint */
        const randint = (start, end) => {
            return Math.floor(
                Math.floor(Math.random() * (end - start)) + start
            );
        };
        const rangeX = clipRange(window.innerWidth, 0.8);
        const rangeY = clipRange(window.innerHeight, 0.8);
        const randX = randint(rangeX[0], rangeX[1]);
        const randY = randint(rangeY[0], rangeY[1]);
        let raindropElement =
            document.querySelectorAll('.ani.rain .raindot')[index];
        raindropElement.style.left = `${randX}px`;
        raindropElement.style.top = `${randY}px`;
    }

    /** After raindrops scale, show hint.
     * (wait for 2s: CSS set static frames)
     * After raindrops shrink, navigate.
     * @param {AnimationEvent} event
     */
    @action
    toggleHint(event) {
        if (event.animationName == 'raindots-scale') {
            console.log(`[fcall] toggleHint(rindots-scale)`);
            this.hint = true;
        } else if (event.animationName == 'raindots-fade') {
            // jump to the target page using builtin labels
            const pseudoLinkElement = document.querySelector('.ani.rain .link');
            if (pseudoLinkElement) pseudoLinkElement.click();
        }
    }
}
