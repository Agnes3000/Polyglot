import request from 'superagent';

class Panel {
	constructor(page) {
		this.page = page;
	}

	// show panel with given text
	show(content) {
		this.page.dispatchMessage('showPanel', content);
	}

	update(content) {
		this.page.dispatchMessage('updatePanel', content);
	}

	showLoadingMessage() {
		this.update('<div class="polyglot__loader">Loading</div>');
	}
}

// Get settings
let apiKey = safari.extension.secureSettings.apiKey;
let targetLanguage = safari.extension.settings.targetLanguage;
let keyboardShortcut = safari.extension.settings.keyboardShortcut;

// Set event handler
safari.application.addEventListener('command', performCommand, false);
safari.application.addEventListener('message', handleMessage, false);
safari.extension.settings.addEventListener('change', settingsChanged, false);
safari.extension.secureSettings.addEventListener('change', settingsChanged, false);

// Check if settings are valid
function assertSettings(panel) {
	if (apiKey === '') {
		panel.update('Set API key. See <a href="https://git.io/vzQ2y" target="_blank">visual guide</a>');
		return false;
	} else if (targetLanguage === '') {
		panel.update('Set target language');
		return false;
	}
	return true;
}

// Translate text
function translateText(text) {
	return new Promise((resolve, reject) => {
		request
			.get('https://www.googleapis.com/language/translate/v2')
			.query({
				key: apiKey,
				target: targetLanguage,
				q: text
			})
			.set('Accept', 'application/json')
			.end((err, res) => {
				// Handle errors
				if (err) {
					return reject(err);
				}
				if (res.body.error) {
					const error = res.body.error.errors[0];
					switch (error.reason) {
						case 'invalid':
							reject('Target language is invalid. please check it');
							break;
						case 'keyInvalid':
							reject('API key is invalid. please check it');
							break;
						default:
					}
					return;
				}

				const {translations} = res.body.data;
				let result = '';
				for (const t of translations) {
					result += t.translatedText + '<br/>';
				}

				resolve(result);
			});
	});
}

// Perform commands from users
function performCommand(event) {
	switch (event.command) {
		case 'translateSelectedText':
			safari.application.activeBrowserWindow.activeTab.page.dispatchMessage('getSelectedText');
			break;
		default:

	}
}

function handleFinishedGetSelectedText(msg) {
	if (msg.message === '') {
		return;
	}
	const panel = new Panel(msg.target);
	panel.showLoadingMessage();

	if (!assertSettings(panel)) {
		return;
	}

	translateText(msg.message)
		.then(result => {
			panel.update(result);
		})
		.catch(err => {
			panel.update(err);
		});
}

function handleRequestKeyboardShortcut(msg) {
	msg.target.page.dispatchMessage('keyboardShortcutReceived', keyboardShortcut);
}

// Handle message from injected script
function handleMessage(msg) {
	switch (msg.name) {
		case 'finishedGetSelectedText':
			handleFinishedGetSelectedText(msg);
			break;
		case 'requestKeyboardShortcut':
			handleRequestKeyboardShortcut(msg);
			break;
		default:
	}
}

// Update setting values immediately
function settingsChanged(event) {
	switch (event.key) {
		case 'apiKey':
			apiKey = event.newValue;
			break;
		case 'targetLanguage':
			targetLanguage = event.newValue;
			break;
		case 'keyboardShortcut':
			keyboardShortcut = event.newValue;
			safari.application.activeBrowserWindow.activeTab.page.dispatchMessage('keyboardShortcutReceived', keyboardShortcut);
			break;
		default:

	}
}
