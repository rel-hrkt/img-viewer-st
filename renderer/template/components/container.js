'use strict';


export class Container {
    constructor(root) {
        this.root = root;
    }

    get container() {
        return this.root.querySelector('.container');
    }

    clear() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    append(item) {
        this.container.appendChild(item);
    }
}
