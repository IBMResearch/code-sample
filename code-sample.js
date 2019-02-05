import { LitElement, html } from '../../@polymer/lit-element/lit-element.js';
import { FlattenedNodesObserver } from '../../@polymer/polymer/lib/utils/flattened-nodes-observer.js';
import { styles } from './styles.js';
import { oneDark } from './themes/one-dark.js';
import '../../highlightjs/highlight.pack.min.js';

/* global hljs */

/**
 * `<code-sample>` uses [highlight.js](https://highlightjs.org/) for syntax highlighting.
 *
 * @customElement
 * @demo https://kcmr.github.io/code-sample/
 */
class CodeSample extends LitElement {
  render() {
    return html`
      ${styles}
      ${this.theme || oneDark}
      <div id="demo" class="demo"></div>

      <slot id="content"></slot>

      <div id="code-container">
        <button id="copy-button"
          ?hidden="${!this.copyClipboardButton}"
          title="Copy to clipboard"
          @click="${() => this._copyToClipboard()}">Copy</button>
        <pre id="code"></pre>
      </div>
    `;
  }

  firstUpdated() {
    this.$_content = this.shadowRoot.querySelector('#content');
    this.$_code = this.shadowRoot.querySelector('#code');
    this.$_copyButton = this.shadowRoot.querySelector('#copy-button');
    this.$_demo = this.shadowRoot.querySelector('#demo');
  }

  static get properties() {
    return {
      // Set to true to show a copy to clipboard button.
      copyClipboardButton: {type: Boolean, attribute: 'copy-clipboard-button'},
      // Tagged template literal with custom styles.
      theme: {type: String},
      // Set to true to render the code inside the template.
      renderTemplate: {type: Boolean, attribute: 'render-template'},
      // Code type (optional). (eg.: html, js, css)
      // Options are the same as the available classes for `<code>` tag using highlight.js
      type: {type: String},
    };
  }

  _toCamelCase(value) {
    return value.replace(/-./g,
      (match) => match.charAt(1).toUpperCase()
    );
  }

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      if (this.querySelector('template')) {
        this._observer = new FlattenedNodesObserver(this.$_content, () => this._updateContent());
      } else if (this.childNodes.length) {
        console.error('<code-sample>:', 'content must be provided inside a <template> tag');
      }
    }, 1);
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
  }

  _updateContent() {
    if (this._code) this._code.parentNode.removeChild(this._code);
    if (this._demo) this.$.demo.innerHTML = '';

    const template = this._getCodeTemplate();

    if (this.renderTemplate) {
      this._demo = this.$_demo.appendChild(
        document.importNode(template.content, true)
      );
    }

    this._highlight(template.innerHTML);
  }

  _getCodeTemplate() {
    const nodes = FlattenedNodesObserver.getFlattenedNodes(this.$_content);
    return [].filter.call(nodes, (node) => node.nodeType === Node.ELEMENT_NODE)[0];
  }

  _highlight(str) {
    this._code = document.createElement('code');
    if (this.type) this._code.classList.add(this.type);
    this._code.innerHTML = this._entitize(this._cleanIndentation(str));
    this.$_code.appendChild(this._code);
    hljs.highlightBlock(this._code);
  }

  _cleanIndentation(str) {
    const pattern = str.match(/\s*\n[\t\s]*/);
    return str.replace(new RegExp(pattern, 'g'), '\n');
  }

  _entitize(str) {
    return String(str)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/=""/g, '')
      .replace(/=&gt;/g, '=>')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _copyToClipboard() {
    const tempNode = document.createElement('textarea');
    document.body.appendChild(tempNode);
    tempNode.value = this._cleanIndentation(this._getCodeTemplate().innerHTML);
    tempNode.select();

    let result = false;

    try {
      result = document.execCommand('copy', false);
      this.$_copyButton.textContent = 'Done';
    } catch (err) {
      console.error(err);
      this.$_copyButton.textContent = 'Error';
    }

    tempNode.remove();

    // Return to the copy button after a second.
    setTimeout(this._resetCopyButtonState.bind(this), 1000);

    return result;
  }

  _resetCopyButtonState() {
    this.$_copyButton.textContent = 'Copy';
  }
}

customElements.define('code-sample', CodeSample);
