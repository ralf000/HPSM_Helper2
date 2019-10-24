function commandHandler(command, delay) {
    if (!command) return false;
    delay = delay || 1000 * 15;

    setTimeout(function () {
        if (command === "newTask") {
            chrome.storage.sync.set({todo: 'regInProcess'});
        } else if (command === "updateTaskList") {
            chrome.storage.sync.set({todo: 'updateTaskList'});
        };
        getHPSMTabId(function (hpsmTab) {
            chrome.tabs.executeScript(hpsmTab, {file: 'autoreg.js'});
        });
    }, delay);
}

chrome.extension.onMessage.addListener(
    function (request) {
        commandHandler(request.command, request.delay);
    });


chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    getHPSMTabId(function (hpsmTab) {
        if (hpsmTab === tabId)
            clean();
    })
});