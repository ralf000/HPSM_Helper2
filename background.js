function commandHandler(command) {
    if (!command)
        return false;

    setTimeout(function () {

        if (command === "newTask")
            chrome.storage.local.set({todo: 'regInProcess'});
        else if (command === "waitNewTask")
            chrome.storage.local.set({todo: 'waitNewTask'});
        else if (command === "deleteTopLayer") {
            getHPSMTabId(function (hpsmTab) {
                
            });
        }


        getHPSMTabId(function (hpsmTab) {
            chrome.tabs.executeScript(hpsmTab, {file: 'autoreg.js'});
        })

    }, 1000 * 10);
}

chrome.extension.onMessage.addListener(
    function (request) {
        commandHandler(request.command);
    });


chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    getHPSMTabId(function (hpsmTab) {
        if (hpsmTab === tabId)
            clean();
    })
});