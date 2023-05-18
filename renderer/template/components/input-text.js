'use strict';


export class InputText {
    constructor(root) {
        this.root = root;
    }

    get text() {
        return this.inputElem.value ?? '';
    }

    set text(newText) {
        this.inputElem.value = newText;
        this.dispatchChangeEvent();
    }

    get inputElem() {
        return this.root.querySelector('input');
    }

    onChange(handler) {
        this.inputElem
            .addEventListener('change', handler);
    }

    dispatchChangeEvent() {
        const event = new Event('change');
        this.inputElem.dispatchEvent(event);
    }
}
