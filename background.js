/**
 * текущая вкладка
 */
async function getTab() {
    return await new Promise(resolve => getSavedParam('tab', result => resolve(result.tab)))
}

function handleCounters(name, counter, type) {
    type = type || 'timeout';
    getSavedParam('counters', ({counters}) => {
        counters = counters || {};
        if (counters[name]) {
            type === 'timeout' ? clearTimeout(counters[name]) : clearInterval(counters[name]);
        }
        const counterId = counter();
        const newCounter = {};
        newCounter[name] = counterId;
        setSavedParam({counters: {...counters, ...newCounter}});
    });
}

async function commandHandler({command, delay}) {
    try {

        const counter = () => setTimeout(async () => {
            if (command === "newTask") {
                setSavedParam({todo: 'regInProcess'});
            } else if (command === "updateTaskList") {
                setSavedParam({todo: 'updateTaskList'});
            }
            const tabId = await getTab();
            chrome.tabs.executeScript(tabId, {file: 'autoreg.js'});
        }, delay);

        handleCounters(command, counter);

    } catch (err) {
        alert(err);
    }
}

chrome.extension.onMessage.addListener(commandHandler);

chrome.tabs.onRemoved.addListener(clean);