/**
 * текущая вкладка
 */
async function getTab() {
    return await new Promise(resolve => getSavedParam('tab', result => resolve(result.tab)))
}

async function commandHandler(command, delay) {
    try {
        if (!command) return false;
        delay = delay || 1000 * 15;

        setTimeout(async function () {
            if (command === "newTask") {
                setSavedParam({todo: 'regInProcess'});
            } else if (command === "updateTaskList") {
                setSavedParam({todo: 'updateTaskList'});
            } else if (command === 'stop') {
                clean();
            }
            if (command !== 'stop') {
                const tabId = await getTab();
                chrome.tabs.executeScript(tabId, {file: 'autoreg.js'});
            }
        }, delay);
    } catch (err) {
        alert(err);
    }
}

chrome.extension.onMessage.addListener(request => commandHandler(request.command, request.delay));

chrome.tabs.onRemoved.addListener(clean);