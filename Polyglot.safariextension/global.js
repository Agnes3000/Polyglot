const {translate} = require('./api');

// Get settings
let settings = {};
Object.keys(safari.extension.settings).forEach(key => {
	settings[key] = safari.extension.settings[key];
});

// Set event handler
safari.application.addEventListener('command', performCommand, false);
safari.application.addEventListener('message', handleMessage, false);
safari.extension.settings.addEventListener('change', settingsChanged, false);

// Perform commands from users
function performCommand(event) {
	const {command} = event;
	if (command === 'translateSelectedText') {
		safari.application.activeBrowserWindow.activeTab.page.dispatchMessage('getSelectedText');
	}
}

// Handle message from injected script
function handleMessage(msg) {
	const {name} = msg;
	if (name === 'finishedGetSelectedText') {
		handleFinishedGetSelectedText(msg);
	} else if (name === 'getSettings') {
		handleGetSettings(msg);
	}
}

function handleFinishedGetSelectedText(msg) {
	const text = msg.message.text;
	// const table = msg.message.table;

	if (text === '') {
		return;
	}
	const target = msg.target;
	target.page.dispatchMessage('showPanel', '<div class="polyglot__loader">Loading</div>');

	if (settings.targetLanguage === '') {
		target.page.dispatchMessage('updatePanel', 'Set target language');
		return;
	}

	translate(text, settings.targetLanguage).then(translatedText => {
		// const tText = translatedText.replace(/<(.+?)>/g, (element, group) => {
		// 	return table[element.replace(/\s/, '')];
		// });
		target.page.dispatchMessage('updatePanel', translatedText);
	}).catch(err => {
		target.page.dispatchMessage('updatePanel', err);
	});
}

function handleGetSettings(msg) {
	msg.target.page.dispatchMessage('settingsReceived', settings);
}

// Update setting values immediately
function settingsChanged(event) {
	settings[event.key] = event.newValue;
	safari.application.activeBrowserWindow.activeTab.page.dispatchMessage('settingsReceived', settings);
}
