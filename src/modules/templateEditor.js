/**
 * Template Editor Module
 * CodeMirror-based HTML/CSS editor with column tag insertion
 */
import { EditorView, basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';

export class TemplateEditor {
  constructor(templateStore) {
    this.templateStore = templateStore;
    this.htmlEditor = null;
    this.cssEditor = null;
    this.headers = [];
    this.onContentChange = null;
    this.currentTemplateKey = 'default';

    this._bindElements();
    this._bindEvents();
    this._initEditors();
  }

  _bindElements() {
    this.htmlContainer = document.getElementById('html-editor-container');
    this.cssContainer = document.getElementById('css-editor-container');
    this.tagsList = document.getElementById('tags-list');
    this.templateSelect = document.getElementById('template-select');
    this.saveTemplateBtn = document.getElementById('btn-save-template');
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.codeEditors = document.querySelectorAll('.code-editor');
  }

  _bindEvents() {
    // Tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.codeEditors.forEach((editor) => {
          editor.classList.toggle('active', editor.id === `${tab}-editor-container`);
        });
      });
    });

    // Template selection
    this.templateSelect.addEventListener('change', (e) => {
      this.currentTemplateKey = e.target.value;
      this._loadTemplate(this.currentTemplateKey);
    });

    // Save template
    this.saveTemplateBtn.addEventListener('click', () => {
      const name = prompt('Save template as:', this.currentTemplateKey);
      if (name) {
        this.templateStore.saveTemplate(name, this.getHTML(), this.getCSS());
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: `Template "${name}" saved!`, type: 'success' },
          })
        );
      }
    });
  }

  _initEditors() {
    const defaultTemplate = this.templateStore.getTemplate('default');

    // HTML Editor
    this.htmlEditor = new EditorView({
      state: EditorState.create({
        doc: defaultTemplate.html,
        extensions: [
          basicSetup,
          html(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && this.onContentChange) {
              this.onContentChange();
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: this.htmlContainer,
    });

    // CSS Editor
    this.cssEditor = new EditorView({
      state: EditorState.create({
        doc: defaultTemplate.css,
        extensions: [
          basicSetup,
          css(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && this.onContentChange) {
              this.onContentChange();
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: this.cssContainer,
    });
  }

  selectTemplate(key) {
    this.templateSelect.value = key;
    this.currentTemplateKey = key;
    this._loadTemplate(key);
  }

  _loadTemplate(key) {
    const template = this.templateStore.getTemplate(key);
    this._setEditorContent(this.htmlEditor, template.html);
    this._setEditorContent(this.cssEditor, template.css);
    if (this.onContentChange) this.onContentChange();
  }

  _setEditorContent(editor, content) {
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: content,
      },
    });
  }

  /**
   * Set available CSV column headers and render clickable tags
   */
  setHeaders(headers) {
    this.headers = headers;
    this.tagsList.innerHTML = '';

    headers.forEach((header) => {
      const tag = document.createElement('button');
      tag.className = 'column-tag';
      tag.textContent = `{{${header}}}`;
      tag.title = `Insert {{${header}}} at cursor`;
      tag.addEventListener('click', () => {
        this._insertAtCursor(`{{${header}}}`);
      });
      this.tagsList.appendChild(tag);
    });
  }

  _insertAtCursor(text) {
    // Determine which editor is active
    const activeTab = document.querySelector('.tab-btn.active');
    const editor = activeTab?.dataset.tab === 'css' ? this.cssEditor : this.htmlEditor;

    const cursor = editor.state.selection.main.head;
    editor.dispatch({
      changes: { from: cursor, insert: text },
      selection: { anchor: cursor + text.length },
    });
    editor.focus();
  }

  getHTML() {
    return this.htmlEditor.state.doc.toString();
  }

  getCSS() {
    return this.cssEditor.state.doc.toString();
  }
}
