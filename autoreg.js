// Глобальные переменные
var w = getActiveWindowByHPSM();
var taskList = getRecordListByHPSM();
var waitTime = 1000 * 60 * 10;
var delay = 1000;
var start = new Date();
var intValId;
var taskType = '';
var emailUrl = 'https://utilites.2hut.ru/hpsm_helper/send-email.php';
var logUrl = 'https://utilites.2hut.ru/hpsm_helper/log.php';

/**
 * отслеживает состояние программы
 */
function checkStatusProgram() {
    intValId = setInterval(function () {
        getAutoRegStatus(function (registration) {
            if (registration === 'off') {
                deleteTopLayer();
                sendLog(logUrl);
                return clearInterval(intValId);
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
    if (new Date() - start >= waitTime) {
        clearInterval(intValId);
        chrome.extension.sendMessage({command: "waitNewTask"}, function () {
            var updateBtn = w.find('button:contains("Обновить")');
            if (updateBtn.length) {
                writeToLog('Обновляю список обращений/инцидентов');
                updateBtn.click();
                //location.reload();
            } else {
                w.find('button:contains("ОК")').click()
            }
        });
    }

}

function wait() {

    writeToLog('Статус: ожидание. До следующей проверки новых обращений/инцидентов: ' + waitTime / 60 / 1000 + ' минут');

    addTopLayerOnPage();
    var t = setTimeout(function () {
        clearTimeout(t);
        update();
    }, waitTime);
}

function isNewTask() {
    if (taskType === 'Обращение') {
        //Обращение
        return (taskList.length && taskList.find('[role=gridcell]:contains("Новое")').length !== 0)
            || (taskList.length && taskList.find('a:contains("Новое")').length !== 0);
    } else {
        //Инцидент
        return (taskList.find('[role=gridcell]:contains("Направлен в группу")').length !== 0)
    }
}

function checkNewTask() {
    if (isContinuePage()) {
        chrome.extension.sendMessage({command: "reloadAutoreg"});
        writeToLog('Сессия истекла. Возвращаюсь на страницу со списком инцидентов/обращений');
        return $('#btnContinue').length
            ? $('#btnContinue')[0].click()
            : $('#loginBtn').click()
    }
    if (!isTasksList()) return registration();

    writeToLog('Проверяю наличие новых обращений/инцидентов');

    if (isNewTask()) {
        isCorrectSearchEnvironment(entranceToTask);
    } else {
        waitWithCorrectEnvironment();
    }
}

function entranceToTask() {

    writeToLog('Обнаружено новое обращение/инцидент');

    chrome.extension.sendMessage({command: "newTask"}, function () {

        writeToLog('Перехожу к регистрации');

        if (taskType === 'Обращение') {
            if ((taskList.length && taskList.find('div:contains("Новое")') !== 0)) {
                if (taskList.length && taskList
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

/**
 * Переходит в режим ожидания новый обращений/инцидентов
 * попутно устанавливая сохраняя/устанавливает очередь и представление
 * которые были выбраны при старте
 */
function waitWithCorrectEnvironment() {
    chrome.storage.sync.get('initRegistration', function (result) {
        var initRegistration = result.initRegistration;
        if (initRegistration && initRegistration === 'on') {
            writeToLog('Начинаю поиск и авторегистрацию новых обращений/инцидентов');
            chrome.storage.sync.remove('initRegistration');
            saveSearchEnvironment();
        }
        setSearchEnvironment(initRegistration);
    });
}

/**
 * Сохраняет выбранные очередь и представление при первом запуске
 */
function saveSearchEnvironment() {
    var queue = getQueue();
    var representation = getRepresentation();
    if (queue && representation) {
        writeToLog('Сохраняю текущую очередь: ' + queue + ' и представление: ' + representation);
        chrome.storage.sync.set({queueName: queue});
        chrome.storage.sync.set({representationName: representation});
    }
}

/**
 * Устанавливает очередь и представление, которые были выбраны при старте (если они изменились)
 * @param initRegistration
 */
function setSearchEnvironment(initRegistration) {
    chrome.storage.sync.get('queueName', function (result) {
        var queueName = result.queueName;
        chrome.storage.sync.get('representationName', function (result) {
            var representationName = result.representationName;

            var currentQueue = getQueue();
            var currentRepresentation = getRepresentation();

            if (!initRegistration) {
                if (currentQueue !== queueName) {
                    writeToLog('Устанавливаю очередь: "' + queueName);
                    chrome.extension.sendMessage({command: "setQueue"});
                    return setQueue(queueName);
                }
                if (currentRepresentation !== representationName) {
                    writeToLog('Устанавливаю представление: "' + representationName);
                    chrome.extension.sendMessage({command: "setRepresentation"});
                    return setRepresentation(representationName);
                }
            }
            return wait();
        });
    });
}

function isCorrectSearchEnvironment(callback) {
    var isCorrect = true;
    chrome.storage.sync.get('queueName', function (result) {
        var queueName = result.queueName;
        chrome.storage.sync.get('representationName', function (result) {
            var representationName = result.representationName;

            var currentQueue = getQueue();
            var currentRepresentation = getRepresentation();

            isCorrect = (currentQueue === queueName) && (currentRepresentation === representationName);
            if (isCorrect) {
                callback();
            }
        });
    });
}

/**
 * Устанавливает очередь
 * @param queueName
 */
function setQueue(queueName) {
    var form = getActiveFrameByHPSM();
    form.find('#X4Button').click();
    setTimeout(function () {
        $.each(form.find('#X4Popup .x-combo-list-item'), function (index, queueItem) {
            queueItem = $(queueItem);
            if (queueItem.text().indexOf(queueName) === 0) {
                return queueItem.click();
            }
        });
    }, delay);
}

/**
 * Устанавливает предоставление
 * @param representationName
 */
function setRepresentation(representationName) {
    var form = getActiveFrameByHPSM();
    form.find('#X6Button').click();
    setTimeout(function () {
        $.each(form.find('#X6Popup .x-combo-list-item'), function (index, representationItem) {
            representationItem = $(representationItem);
            if (representationItem.text().indexOf(representationName) === 0) {
                return representationItem.click();
            }
        });
    }, delay);
}

function registration() {
    if (isTasksList()) return checkNewTask();

    writeToLog('Регистрация обращения/инцидента в процессе');

    clearInterval(intValId);

    writeToLog('Статус обращения/инцидента: ' + getStatus());

    var commonMsg = $('#commonMsg');
    if (commonMsg.length) {
        writeToLog(commonMsg.text());

        if (commonMsg.text().indexOf('Обновляемая запись с момента считывания была изменена') !== -1) {
            w.find('button:contains("Обновить")').click();
        }
    }

    chrome.extension.sendMessage({command: "newTask"}, function () {

        var number = getNumber();
        var title = getTitle();

        var toEngineerBtn = w.find('button:contains("Передать Инженеру")');
        var toWorkBtn = w.find('button:contains("В работу")');
        var OKBtn = w.find('button:contains("ОК")');
        var cancelBtn = w.find('button:contains("Отмена")');

        if ((getStatus() !== 'Новое' && getStatus() !== 'Направлен в группу')
            || (w.find('button:contains("Передать Инженеру")').length === 0 && w.find('button:contains("В работу")').length === 0)
        ) {
            writeToLog('Выход из регистрации обращения');

            sendEmail(emailUrl, number, title, now());

            if (OKBtn.length) {
                writeToLog('Нажимаю на кнопку: ОК');
                return OKBtn.click();
            }
            if (cancelBtn.length) {
                writeToLog('Нажимаю на кнопку: Отмена');
                return cancelBtn.click();
            }
        }
        writeToLog('Регистрирую обращение/инцидент под номером ' + number);

        var form = getActiveFormByHPSM();
        var resolution = form.find('textarea[name="instance/resolution/resolution"]');
        if (resolution.length)
            resolution.val('АвтоРегистрация: ' + now());

        if (toEngineerBtn.length) {
            writeToLog('Нажимаю на кнопку: Передать Инженеру');
            return toEngineerBtn.click()
        }
        if (toWorkBtn.length) {
            writeToLog('Нажимаю на кнопку: В работу');
            return toWorkBtn.click()
        }
        if (OKBtn.length) {
            writeToLog('Нажимаю на кнопку: ОК');
            return OKBtn.click();
        }
        if (cancelBtn.length) {
           writeToLog('Нажимаю на кнопку: Отмена');
            return cancelBtn.click();
        }
        writeToLog('Ошибка: не найдено кнопок для продолжения авторегистрации')
    });
}

function getCommandFromBackground() {
    writeToLog('Получаю команду');

    chrome.storage.sync.get('todo', function (result) {
        var todo = result.todo;
        chrome.storage.sync.remove('todo');
        if (todo === 'regInProcess') {
            registration();
        } else if (todo === 'reloadAutoreg') {
            setTimeout(function () {
                writeToLog('Перезапускаю авторегистрацию после истечения сессии');
                run();
            }, delay);
        } else {
            checkNewTask();
        }
    });
}

function onOffRegHandler(registration) {
    init();
    if (registration === 'on') {
        writeToLog('Статус: авторегистрация');
        getCommandFromBackground();
    } else {
    }
}

function checkTaskType() {
    var frame = getActiveFrameByHPSM();
    taskType = frame.find('#X1 span').text();
}

function initHandlers() {
    $(document).on('click', '#sendLogs', function (e) {
        e.preventDefault();
        sendLog(logUrl);
    });
}

function init() {
    checkStatusProgram();
    checkTaskType();
    initHandlers();
}

function run() {
    getAutoRegStatus(onOffRegHandler);
}

//запуск
run();