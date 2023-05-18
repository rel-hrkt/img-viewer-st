'use strict'

import { Container } from './template/components/container.js'
import { InputText as InputTextComponent } from './template/components/input-text.js'
import { Template } from './template/template.js'


class ImgFrame extends Template {
    static get tagName() { return 'img-frame' }

    constructor() {
        super('img-frame')
    }

    static get observedAttributes() {
        return [
            'url',
            'width',
            'height',
        ]
    }

    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.updateImage(this)
    }

    updateImage(elem) {
        const w = elem.getAttribute('width') ?? '10rem'
        const h = elem.getAttribute('height') ?? '10rem'
        const url = elem.getAttribute('url')

        const shadow = elem.shadowRoot
        shadow.querySelector('style').textContent = `
.frame {
    width: ${w};
    height: ${h};

    position: relative;
}
.img {
    position: absolute;
    top: 0;
    left: 0;

    width: inherit;
    height: inherit;
    background-image: url("${url}");

    background-size: cover;
    background-position: center;
}`
    }

}


class GryphIcon extends Template {
    static get tagName() { return 'gryph-icon' }

    constructor() {
        super('gryph-icon')
    }

    static get observedAttributes() {
        return [
            'gryph',
            'font-size',
        ]
    }

    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.updateGryph(this)
    }

    updateGryph(elem) {
        const fontsize = elem.getAttribute('font-size') ?? '1em'
        const gryph = elem.getAttribute('gryph')

        const shadow = elem.shadowRoot
        shadow.querySelector('style').textContent = `
            .gryph {
                font-size: ${fontsize};
            }
            .gryph::before {
                content: "${gryph}";
            }
        `
    }
}


class SimpleIcon extends Template {
    static get tagName() { return 'simple-icon' }

    constructor() {
        super('simple-icon')
    }

    static get observedAttributes() {
        return [
            'icon',
            'color',
        ]
    }

    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.updateIcon(this)
    }

    updateIcon(elem) {
        const iconname = elem.getAttribute('icon')
        const color = elem.getAttribute('color')

        const shadow = elem.shadowRoot
        const icon = shadow.querySelector('span')
        icon.className = ''
        icon.classList.add(iconname)
        icon.style.setProperty('--color', color)
    }
}


class InputText extends Template {
    static get tagName() { return 'input-text' }

    constructor() {
        super('input-text')
    }

    static get observedAttributes() {
        return [
            'prefix-symbol',
        ]
    }

    updateOnAttributesChanged(elem) {
        const prefixSymbol = elem.getAttribute('prefix-symbol') ?? '>'

        const shadow = elem.shadowRoot
        const prefix = shadow.querySelector('div[data-prefix-symbol]')
        prefix.dataset.prefixSymbol = prefixSymbol
    }
}


class ItemContainer extends Template {
    static get tagName() { return 'item-container' }

    static get observedAttributes() {
        return [
            'direction',
        ]
    }

    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.updateOrder(this)
    }

    updateOrder(elem) {
        const direction = elem.getAttribute('direction') ?? 'row'

        const shadow = elem.shadowRoot
        const container = shadow.querySelector('.container')
        container.style.setProperty('--direction', direction)
    }

    constructor() {
        super('item-container')

        const container = new Container(this.shadowRoot)
        Array.from(this.children).forEach(child => {
            container.append(child)
        })
    }
}


class ImageViewer extends Template {
    static get tagName() { return 'image-viewer' }

    static get imageExtentions() {
        return [
            'jpg',
            'png',
        ]
    }

    constructor() {
        super('image-viewer')

        this.api = window.imgViewer
        const root = this.shadowRoot

        const inputText = new InputTextComponent(root.querySelector('input-text').shadowRoot)
        inputText.onChange(() => {
            const updatedUrl = inputText.text
            this.handlInputUrlChange(updatedUrl)
        })

        this.dirItemContainer = new Container(root.querySelector('item-container[data-type="fs:dir"]').shadowRoot)

        // Initialize
        inputText.text = './'
    }

    get imageItemContainer() {
        return new Container(this.shadowRoot.querySelector('item-container[data-type="fs:image"]').shadowRoot)
    }

    handlInputUrlChange(url) {
        [
            this.dirItemContainer,
            this.imageItemContainer,
        ].forEach(container => { container.clear() })

        this.api.dir(url)
            .then(files => files.map(({ filename, isDirectory, isFile }) => ({
                filename: filename.replace(/\\+/g, '/'),
                isDirectory,
                isFile,
            })))
            .then(files => {
                files.filter(f => f.isDirectory)
                    .forEach(dir => {
                        const p = document.createElement('p')
                        p.textContent = dir.filename
                        this.dirItemContainer.append(p)
                    })

                files.filter(f => f.isFile)
                    .filter(f => ImageViewer.imageExtentions.map(ext => f.filename.endsWith(`.${ext}`)).some(t => t))
                    .forEach(imgfile => {
                        const imgFrame = document.createElement('img-frame')
                        imgFrame.setAttribute('url', `${imgfile.filename}`)
                        this.imageItemContainer.append(imgFrame)
                    })
            })
            .catch(e => {
                console.error(e)
            })
    }
}


document.addEventListener('DOMContentLoaded', () => {
    [
        ImgFrame,
        GryphIcon,
        SimpleIcon,
        InputText,
        ItemContainer,
        ImageViewer,
    ].forEach(customElem => {
        // カスタム要素を登録するとHTML上の<img-frame>等が使用可能になる。
        customElements.define(customElem.tagName, customElem)
    })
})
