class Panel {
	constructor(domID) {
		this.domID = domID;
		this.isOpen = false;

		this.show();
	}

	domElement() {
		return document.getElementById(this.domID);
	}

	show(content = '', bounds) {
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

	remove() {
		this.domElement().remove();
		this.isOpen = false;
	}
}

let keyboardShortcut = null;

const panel = new Panel('polyglot__panel', this);

// Only initialize in a top-level page
if (window.top === window) {
	safari.self.addEventListener('message', handleMessage, false);

	window.addEventListener('keydown', handleKeydown, false);
	window.addEventListener('mouseup', handleMouseUp, false);

	safari.self.tab.dispatchMessage('requestKeyboardShortcut');
}

// Get selected text and return to global script
function handleMessage(msg) {
	switch (msg.name) {
		case 'keyboardShortcutReceived':
			keyboardShortcut = parseInt(msg.message, 10);
			break;
		case 'getSelectedText':
			getSelectedText();
			break;
		case 'showPanel':
			panel.show(msg.message, getSelectionBoundingRect());
			break;
		case 'updatePanel':
			panel.update(msg.message);
			break;
		default:

	}
}

function handleMouseUp(e) {
	if (isPanelOpen && !isDescendant(panel, e.target)) {
		panel.remove();
	}
}

function handleKeydown(e) {
	if (e.keyCode === keyboardShortcut) {
		e.preventDefault();
		getSelectedText();
	}
}

function getSelectedText() {
	const sel = window.getSelection().toString();
	safari.self.tab.dispatchMessage('finishedGetSelectedText', sel);
}

// Return selection coords
function getSelectionBoundingRect() {
	const rect = {
		left: 0,
		top: 0,
		right: 0,
		bottom: 0
	};

	const sel = document.getSelection();
	for (let i = 0; i < sel.rangeCount; ++i) {
		const _rect = sel.getRangeAt(i).getBoundingClientRect();
		if (rect.left < _rect.left) {
			rect.left = _rect.left;
		}
		if (rect.top < _rect.top) {
			rect.top = _rect.top;
		}
		if (rect.right < _rect.right) {
			rect.right = _rect.right;
		}
		if (rect.bottom < _rect.bottom) {
			rect.bottom = _rect.bottom;
		}
	}
	rect.width = rect.right - rect.left;
	rect.height = rect.bottom - rect.top;
	rect.left += window.pageXOffset;
	rect.top += window.pageYOffset;
	rect.right += window.pageXOffset;
	rect.bottom += window.pageYOffset;
	return sel.rangeCount ? rect : null;
}

function isDescendant(parent, child) {
	if (parent === child) {
		return true;
	}
	let node = child.parentNode;
	while (node !== null) {
		if (node === parent) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
}
