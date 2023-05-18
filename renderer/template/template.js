'use strict'


// ImageViewerで定義するカスタム要素の基底クラスを定義します。
export class Template extends HTMLElement {
    constructor(id) {
        super()

        const template = document.getElementById(`template@${id}`)
        const templateContent = template.content
        const clone = templateContent.cloneNode(true)

        // 全てのテンプレートにcssを読み込ませます。
        // この処理により、template定義に以下のタグが不必要になります。
        // <link href="./assets/css/styles.css" rel="stylesheet">
        // 他にも共通したcssがある場合は、ここにcssのURLを記述します。
        const links = [
            `./assets/css/destyle.css`,
        ].map(link => {
            const l = document.createElement('link')
            l.rel = 'stylesheet'
            l.href = link
            return l
        }).forEach(link => {
            clone.insertBefore(link, clone.firstChild)
        })

        this.attachShadow({ mode: 'open' })
            .appendChild(clone)
    }

    static get observedAttributes() {
        return []
    }

    attributeChangedCallback(_name, _oldValue, _newValue) {
        this.updateOnAttributesChanged(this)
    }

    updateOnAttributesChanged(_elem) {
    }
}
