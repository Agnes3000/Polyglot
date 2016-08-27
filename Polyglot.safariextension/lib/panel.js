class Panel {
	constructor(domID, page) {
		this.domID = domID;
		this.page = page;

		this.isOpen = false;

		this.show();
	}

	domElement() {
		return document.getElementById(this.domID);
	}

	// injected
	handleShowPanel(bounds, content = '') {
		if (this.isOpen) {
			this.remove();
		}
		if (bounds === null) {
			return false;
		}
		const el = document.createElement('div');
		el.innerHTML = content;
		el.id = this.domID;
		el.style.left = bounds.left + 'px';
		el.style.top = bounds.bottom + 'px';
		document.body.insertBefore(el, document.body.firstChild);
		this.isOpen = true;
	}

	// global
	// show panel with given text
	show(content) {
		this.page.dispatchMessage('showPanel', content);
	}

	// global
	update(content) {
		this.page.dispatchMessage('updatePanel', content);
	}

	// injected
	remove() {
		this.domElement().remove();
		this.isOpen = false;
	}

	// global
	showLoadingMessage() {
		this.update('<div class="polyglot__loader">Loading</div>');
	}
}

module.exports = Panel;
