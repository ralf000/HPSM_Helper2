// Глобальные переменные
var w = getActiveWindowByHPSM();
var taskList = getRecordListByHPSM();
var waitTime = 1000 * 60 * 15;
var start = new Date();
var intValId;
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
    }, 1000);
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
    $('#toplayer').fadeIn();
}

function update() {
    if (new Date() - start < waitTime) {
        setTimeout(function () {
            update();
        }, waitTime / 20);
    }

    //console.log('sendMessage: waitNewTask');
    clearInterval(intValId);
    chrome.extension.sendMessage({command: "waitNewTask"});
    w.find('button:contains("Обновить")')
        ? w.find('button:contains("Обновить")').click()
        : w.find('button:contains("ОК")').click();
}

function wait() {
    //console.log('wait');

    addTopLayerOnPage();
    setTimeout(function () {
        update();
    }, waitTime);
}

function isNewTask() {
    return (taskList.find('a:contains("Новое")').length !== 0);
}

function checkNewTask() {
    //console.log('checkNewTask');
    if (!isTasksList()) {
        registration();
        return;
    }

    if (isNewTask()) {
        //console.log('sendMessage: newTask');

        chrome.extension.sendMessage({command: "newTask"});
        return taskList.find('a:contains("Новое")')[0].click();
    }
    return wait();
}


function registration() {
    //console.log('registration');

    if (isTasksList()) return checkNewTask();

    clearInterval(intValId);
    chrome.extension.sendMessage({command: "waitNewTask"});
    if (getStatus() !== 'Новое'
        || (w.find('button:contains("Передать Инженеру")').length === 0
        && w.find('button:contains("В работу")').length === 0)
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
        //console.log('registration: on');
        getCommandFromBackground();
    } else {
        //console.log('registration: off');
    }
}

function run() {
    checkStatusProgram();
    getAutoRegStatus(onOffRegHandler);
}

//запуск
run();
