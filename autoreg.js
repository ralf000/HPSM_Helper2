// Глобальные переменные
var w = getActiveWindowByHPSM();
var taskList = getRecordListByHPSM();
var waitTime = 1000 * 60 * 10;
var delay = 1000;
var start = new Date();
var intValId;
var taskType = '';

function now() {
    return (new Date().toLocaleString());
}

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
    } else {
        clearInterval(intValId);
        chrome.extension.sendMessage({command: "waitNewTask"}, function () {
            w.find('button:contains("Обновить")')
                ? w.find('button:contains("Обновить")').click()
                : w.find('button:contains("ОК")').click();
        });
    }

}

function wait() {

    console.log(now() + ' Статус: ожидание. До следующей проверки новых обращений/инцидентов: ' + waitTime / 60 / 1000 + ' минут');

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

    console.log(now() + ' Проверяю наличие новых обращений/инцидентов');

    // $('button[aria-label="Обновить"]').click();

    if (isNewTask()) {

        console.log(now() + ' Обнаружено новое обращение/инцидент');

        chrome.extension.sendMessage({command: "newTask"}, function () {

            console.log(now() + ' Перехожу к регистрации');

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
        });

    }
    return wait();
}


function registration() {
    if (isTasksList()) return checkNewTask();

    console.log(now() + ' Регистрация обращения/инцидента в процессе');

    clearInterval(intValId);
    chrome.extension.sendMessage({command: "waitNewTask"}, function () {

        //w.find('button:contains("Обновить")').click();

        setTimeout(function () {
            console.log(now() + ' Статус обращения/инцидента: ' + getStatus());

            if ((getStatus() !== 'Новое' && getStatus() !== 'Направлен в группу')
                || (w.find('button:contains("Передать Инженеру")').length === 0 && w.find('button:contains("В работу")').length === 0)
            ) {
                console.log(now() + ' Выход из регистрации обращения');
                return w.find('button:contains("ОК")').click();
            }
            var form = getActiveFormByHPSM();

            //логи
            if (form.find('[ref="instance/incident.id"] span').length !== 0)
                console.log(now() + ' Регистрирую обращение/инцидент под номером ' + form.find('[ref="instance/incident.id"] span').text());
            ///логи

            var resolution = form.find('textarea[name="instance/resolution/resolution"]');
            if (resolution.length !== 0)
                resolution.val('АвтоРегистрация: ' + now());

            return (w.find('button:contains("Передать Инженеру")').length !== 0)
                ? w.find('button:contains("Передать Инженеру")').click()
                : w.find('button:contains("В работу")').click();
        }, delay * 5);

    });
}

function getCommandFromBackground() {
    console.log(now() + ' Получаю команду');
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
    init();
    if (registration === 'on') {
        console.log(now() + ' Статус: авторегистрация');
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
    getAutoRegStatus(onOffRegHandler);
}

//запуск
run();
