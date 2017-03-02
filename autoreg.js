// Глобальные переменные
var w = getActiveWindowByHPSM();
var taskList = getRecordListByHPSM();
var waitTime = 1000 * 60 * 10;
var delay = 1000;
var start = new Date();
var intValId;
var taskType = '';

/**
 * отслеживает состояние программы
 */
function checkStatusProgram() {
    intValId = setInterval(function () {
        getAutoRegStatus(function (registration) {
            if (registration === 'off') {
                clearInterval(intValId);
                deleteTopLayer();
            }
        });
    }, delay);
}

function deleteTopLayer() {
    if ($('#toplayer').length !== 0)
        $('#toplayer').remove();
}

function addTopLayerOnPage() {
    if (!isTasksList())
        return false;

    deleteTopLayer();

    $('body').append(getTopLayer());
    $('#toplayer').show();
}

function update() {
    if (new Date() - start < waitTime) {
        setTimeout(function () {
            return update();
        }, waitTime / 10);
    }

    clearInterval(intValId);
    chrome.extension.sendMessage({command: "waitNewTask"});
    w.find('button:contains("Обновить")')
        ? w.find('button:contains("Обновить")').click()
        : w.find('button:contains("ОК")').click();
}

function wait() {

    addTopLayerOnPage();
    var t = setTimeout(function () {
        clearTimeout(t);
        update();
    }, waitTime);
}

function isNewTask() {
    if (taskType === 'Обращение') {
        //Обращение
        return (taskList.find('[role=gridcell]:contains("Новое")').length !== 0)
            || (taskList.find('a:contains("Новое")').length !== 0);
    } else {
        //Инцидент
        return (taskList.find('[role=gridcell]:contains("Направлен в группу")').length !== 0)
    }
}

function checkNewTask() {
    if (!isTasksList()) {
        registration();
        return;
    }

    // $('button[aria-label="Обновить"]').click();

    if (isNewTask()) {
        chrome.extension.sendMessage({command: "newTask"});
        if (taskType === 'Обращение') {
            if ((taskList.find('div:contains("Новое")') !== 0)) {
                if (taskList
                        .find('div:contains("Новое")')
                        .closest('table.x-grid3-row-table')
                        .find('a') !== 0)
                    return taskList
                        .find('div:contains("Новое")')
                        .closest('table.x-grid3-row-table')
                        .find('a')[0]
                        .click();
            }
            return taskList
                .find('a:contains("Новое")')[0]
                .click();
        } else {
            if (taskList.find('div:contains("Направлен в группу")') !== 0) {
                return taskList
                    .find('div:contains("Направлен в группу")')
                    .closest('table.x-grid3-row-table')
                    .find('a')[0]
                    .click();
            }
        }
    }
    return wait();
}


function registration() {
    if (isTasksList()) return checkNewTask();

    clearInterval(intValId);
    chrome.extension.sendMessage({command: "waitNewTask"});

    w.find('button:contains("Обновить")').click();

    setTimeout(function () {
        if ((getStatus() !== 'Новое' && getStatus() !== 'Направлен в группу')
            || (w.find('button:contains("Передать Инженеру")').length === 0 && w.find('button:contains("В работу")').length === 0)
        ) {
            return w.find('button:contains("ОК")').click();
        }
        var form = getActiveFormByHPSM();
        var resolution = form.find('textarea[name="instance/resolution/resolution"]');
        if (resolution.length !== 0)
            resolution.val('АвтоРегистрация: ' + (new Date).toLocaleString());

        return (w.find('button:contains("Передать Инженеру")').length !== 0)
            ? w.find('button:contains("Передать Инженеру")').click()
            : w.find('button:contains("В работу")').click();
    }, delay * 5);
}

function getCommandFromBackground() {
    chrome.storage.local.get('todo', function (result) {
        var todo = result.todo;
        if (todo === 'regInProcess') {
            registration();
        } else {
            checkNewTask();
        }
    });
}

function onOffRegHandler(registration) {
    if (registration === 'on') {
        getCommandFromBackground();
    } else {
    }
}

function checkTaskType() {
    var frame = getActiveFrameByHPSM();
    taskType = frame.find('#X1 span').text();
}

function init() {
    checkStatusProgram();
    checkTaskType();
}

function run() {
    init();
    getAutoRegStatus(onOffRegHandler);
}

//запуск
run();
