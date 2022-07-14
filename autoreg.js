// Глобальные переменные
var w = getActiveWindowByHPSM();
var backgroundDelay = 1000 * 16;
var waitTime = 1000 * 60 * 10 - backgroundDelay;
var delay = 500;
var intValId;
var taskType = '';
//логин от HPSM
var loginHPSM;
//пароль от HPSM
var passwordHPSM;
//логин от новой HPSM
var loginNewHPSM;
//пароль от новой HPSM
var passwordNewHPSM;
//email для оповещений
var alertEmail;
//пароль для оповещений
var alertEmailPassword;
//метка о начале регистрации
var initRegistration;
//установленная очередь для поиска обращений/инцидентов
var queueName;
//установленное представление для поиска обращений/инцидентов
var representationName;
//команда от бекграунда
var todo;
//обращения/инциденты вместе с попытками их сохранить {IM235690: 3, IM235862: 5}
var savingAttempts = {};
//макс. попыток сохранить обращение/инцидент
var maxSavingAttempts = 3;
//список новых обращений/инцидентов с отправленным оповещением
var newTaskSentMessages = [];
//список обращений/инцидентов с превышенным количеством попыток сохранения и отправленным оповещением об этом
var exceededTaskSentMessages = [];
//Получает метку, сигнализирующую, что нужно применять некоторое особое поведение при регистрации обращений
var appealsTag;
//Получает метку, сигнализирующую, что нужно применять некоторое особое поведение при регистрации инциде
var incidentsTag;
//Уровни обращений для отправки уведомлений
var appealNotifications = [];
//Уровни инцидентов для отправки уведомлений
var incidentNotifications = [];
//Уровни обращений для отключения авторегистрации
var appealNotReg = [];
//Уровни инцидентов для отключения авторегистрации
var incidentNotReg = [];
//Уровни обращений для автовзятия в работу
var appealToWork = [];
//Уровни инцидентов для автовзятия в работу
var incidentToWork = [];
//токен бота тг для отправки оповещений об обращениях
var tgAppealBotApiToken;
//id чата тг для отправки оповещений об обращениях
var tgAppealChatId;
//токен бота тг для отправки оповещений об инцидентах
var tgIncidentBotApiToken;
//id чата тг для отправки оповещений об инцидентах
var tgIncidentChatId;

/**
 * отслеживает состояние программы
 */
function checkStatusProgram() {
    intValId = setInterval(function () {
        getAutoRegStatus(function (registration) {
            if (registration === 'off') {
                deleteTopLayer();
                clean();
                //sendLog(logUrl);
                chrome.extension.sendMessage({command: "stop", delay: 1000});
                return clearInterval(intValId);
            }
        });
    }, delay * 2);
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
    clearInterval(intValId);

    chrome.extension.sendMessage({command: "checkForNewTasks", delay: 1000 * 5}, function () {
        var updateBtn = w.find('button:contains("Обновить")');
        if (updateBtn.length) {
            writeToLog('Обновляю список обращений/инцидентов');
            updateBtn.click();
        } else {
            w.find('button:contains("ОК")').click()
        }
    });
}

function wait() {

    writeToLog('Новых обращений/инцидентов не найдено. До следующей проверки: ' + (waitTime + backgroundDelay) / 60 / 1000 + ' мин');

    addTopLayerOnPage();

    chrome.extension.sendMessage({command: "updateTaskList", delay: waitTime});
}

function isNewTask() {
    var taskList = getRecordListByHPSM();
    if (isAppeal()) {
        //Обращение
        return (taskList.length && taskList.find('[role=gridcell]:contains("Новое")').length !== 0)
            || (taskList.length && taskList.find('a:contains("Новое")').length !== 0);
    } else {
        //Инцидент
        return (taskList.find('[role=gridcell]:contains("Направлен в группу")').length !== 0)
    }
}

function checkNewTask() {
    if (!isTasksList()) return registration();

    writeToLog('Проверяю наличие новых обращений/инцидентов');

    if (isNewTask()) {
        isCorrectSearchEnvironment(findAndEnterToTask);
    } else {
        waitWithCorrectEnvironment();
    }
}

function findAndEnterToTask() {

    writeToLog('Обнаружено новое обращение/инцидент');

    chrome.extension.sendMessage({command: "newTask"}, function () {

        writeToLog('Перехожу к регистрации');

        const taskList = getRecordListByHPSM();
        if (isAppeal()) {
            return enterToAppeal(taskList);
        }
        return enterToIncident(taskList);
    });
}

function getTitleFromTaskFromList(task) {
    const frame = getActiveFrameByHPSM();
    const index = frame.find('.x-grid3-header').find('.x-grid3-hd-inner:contains("Краткое описание")').closest('td').index();
    return $(task).find(`.x-grid3-td-${index}`).text().trim();
}

function enterToAppeal(taskList) {
    if (!taskList.length || taskList.find('div:contains("Новое")') === 0) return;

    const newTasks = taskList
        .find('table.x-grid3-row')
        .filter(function (i, el) {
            let number = $(el).find('[id^="ext-gen-list"]').text().trim();
            let title = getTitleFromTaskFromList();
            if ($(el).find('div:contains("Новое")') === 0) return false;
            //фильтруем талоны с превышенным количеством попыток их сохранить или если запрещено регистрировать
            if (savingAttempts[number] && savingAttempts[number] >= maxSavingAttempts) {
                sendExceededTaskNotificationMessage(number, title, now());
                return false;
            }
            //шлем уведомление о регистрации обращения/инцидента
            sendNewTaskNotification(number, title, now());
            //если для текущего приоритета талона стоит пометка "не регистрировать", то пропускаем его
            if ($(el).find('.field_priority_code').length) {
                const priority = $(el).find('.field_priority_code').text().trim().match(/\d+/)[0];
                if (incidentNotReg[priority - 1]) return false;
            }
            return true;
        });

    if (newTasks.length) {
        newTasks
            .find('div:contains("Новое")')
            .closest('table.x-grid3-row-table')
            .find('a')[0]
            .click();
    }
}

function enterToIncident(taskList) {
    if (!taskList.length || taskList.find('div:contains("Направлен в группу")') === 0) return;

    const newTasks = taskList
        .find('table.x-grid3-row-table')
        .filter(function (i, el) {
            let number = $(el).find('[id^="ext-gen-list"]').text().trim();
            let title = getTitleFromTaskFromList();
            if (!$(el).find('div:contains("Направлен в группу")').length) return false;
            //фильтруем талоны с превышенным количеством попыток их сохранить или если запрещено регистрировать
            if (savingAttempts[number] && savingAttempts[number] >= maxSavingAttempts) {
                sendExceededTaskNotificationMessage(number, title, now());
                return false;
            }
            //шлем уведомление о регистрации обращения/инцидента
            sendNewTaskNotification(number, title, now());
            //если для текущего приоритета талона стоит пометка "не регистрировать", то пропускаем его
            if ($(el).find('.field_priority_code').length) {
                const priority = $(el).find('.field_priority_code').text().trim().match(/\d+/)[0];
                if (incidentNotReg[priority - 1]) return false;
            }
            return true;
        })
        .find('a');

    if (newTasks.length) newTasks[0].click();
}

/**
 * Переходит в режим ожидания новый обращений/инцидентов
 * попутно устанавливая сохраняя/устанавливает очередь и представление
 * которые были выбраны при старте
 */
function waitWithCorrectEnvironment() {
    if (initRegistration && initRegistration === 'on') {
        chrome.storage.sync.remove('initRegistration');
        saveSearchEnvironment();
    }
    setSearchEnvironment();
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
 */
function setSearchEnvironment() {
    var currentQueue = getQueue();
    var currentRepresentation = getRepresentation();

    if (!initRegistration) {
        if (currentQueue !== queueName) {
            writeToLog('Устанавливаю очередь: ' + queueName);
            chrome.extension.sendMessage({command: "setQueue"});
            return setQueue(queueName);
        }
        if (currentRepresentation !== representationName) {
            writeToLog('Устанавливаю представление: ' + representationName);
            chrome.extension.sendMessage({command: "setRepresentation"});
            return setRepresentation(representationName);
        }
    }
    return wait();
}

function isCorrectSearchEnvironment(callback) {
    var currentQueue = getQueue();
    var currentRepresentation = getRepresentation();

    var isCorrect = (currentQueue === queueName) && (currentRepresentation === representationName);
    if (isCorrect) {
        callback();
    }
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

    clearInterval(intValId);

    writeToLog('Статус обращения/инцидента: ' + getStatus());

    var commonMsg = $('#commonMsg');
    if (commonMsg.length) {
        writeToLog(commonMsg.text());
    }

    chrome.extension.sendMessage({command: "newTask"}, function () {

        var number = getNumber();
        var title = getTitle();

        var toEngineerBtn = w.find('button:contains("Передать Инженеру")');
        var toWorkBtn = w.find('button:contains("В работу")');
        var OKBtn = w.find('button:contains("ОК")');

        if (isNewHPSM()) {
            toWorkBtn = w.find('button:contains("Взять в работу")');
            OKBtn = w.find('button:contains("Возврат")');
        }
        var cancelBtn = w.find('button:contains("Отмена")');

        //если стоит метка, что обращения/инциденты данного приоритета нужно брать в работу, то пытаемся взять в работу
        const priority = getPriority();
        const toWorkLevels = isAppeal() ? appealToWork : incidentToWork;
        if (priority && toWorkLevels[priority - 1] && toWorkBtn.length) {
            return clickToWork(toWorkBtn, cancelBtn, number, title);
        }

        if ((getStatus() !== statusNew && getStatus() !== 'Направлен в группу')
            || (!toEngineerBtn.length && !toWorkBtn.length)
        ) {
            //шлет уведомление о регистрации обращения/инцидента
            // sendNewTaskNotification(number, title, now());
            writeToLog('Выход из регистрации обращения');

            if (OKBtn.length) {
                writeToLog('Нажимаю на кнопку: ОК/Возврат');
                return OKBtn.click();
            }
            if (cancelBtn.length) {
                writeToLog('Нажимаю на кнопку: Отмена');
                return cancelBtn.click();
            }
            return writeToLog('Ошибка: не найдено кнопок для выхода из зарегистрированного обращения/инцидента');
        }

        writeToLog('Регистрирую обращение/инцидент под номером ' + number);

        if (toEngineerBtn.length) {
            return setSavingAttempts(
                number,
                () => {
                    writeToLog('Нажимаю на кнопку: Передать Инженеру');
                    toEngineerBtn.click()
                },
                () => {
                    writeToLog(`Превышено количество попыток сохранения талона ${number}. Нажимаю на кнопку: Отмена`);
                    sendExceededTaskNotificationMessage(number, title, now());
                    cancelBtn.click()
                }
            );
        }
        if (OKBtn.length) {
            writeToLog('Нажимаю на кнопку: ОК/Возврат');
            return OKBtn.click();
        }
        if (cancelBtn.length) {
            writeToLog('Нажимаю на кнопку: Отмена');
            return cancelBtn.click();
        }
        writeToLog('Ошибка: не найдено кнопок для продолжения авторегистрации');
    });
}

//нажимает кнопку "взять в работу"
function clickToWork(toWorkBtn, cancelBtn, number, title) {
    return setSavingAttempts(
        number,
        () => {
            writeToLog('Нажимаю на кнопку: В работу/Взять в работу');
            toWorkBtn.click()
        },
        () => {
            writeToLog(`Превышено количество попыток сохранения талона ${number}. Нажимаю на кнопку: Отмена`);
            sendExceededTaskNotificationMessage(number, title, now());
            cancelBtn.click()
        }
    );
}

function getCommandFromBackground() {
    chrome.storage.sync.remove('todo');
    if (todo === 'regInProcess') {
        return registration();
    }
    if (todo === 'updateTaskList') {
        return update();
    }
    checkNewTask();
}

function onOffRegHandler(registration) {
    init();
    if (registration === 'on') {
        if (isContinuePage()) {
            return handleContinuePage();
        }
        getCommandFromBackground();
    }
}

function handleLoginPage() {
    var loginField = $('#LoginUsername');
    var passwordField = $('#LoginPassword');
    if (isNewHPSM()) {
        if (loginNewHPSM) {
            loginField.val(loginNewHPSM);
        }
        if (passwordNewHPSM) {
            passwordField.val(passwordNewHPSM);
        }
    } else {
        if (loginHPSM) {
            loginField.val(loginHPSM);
        }
        if (passwordHPSM) {
            passwordField.val(passwordHPSM);
        }
    }
    var selectLanguage = $('#selectedLanguage');
    if (selectLanguage.length && selectLanguage.val() === 'English') {
        selectLanguage.val('Russian');
        selectLanguage.click();
    }
}

function checkTaskType() {
    var frame = getActiveFrameByHPSM();
    if (isTasksList()) {
        taskType = frame.find('#X1 span').text();
    } else {
        taskType = $('.x-tab-strip-active .x-tab-strip-text').text().trim().toLowerCase().indexOf('инцид') === -1 ? 'Обращение' : 'Инцидент';
    }
    // if (!taskType) taskType = frame.find('#X4').val().toLowerCase().indexOf('инцид') === -1 ? 'Обращение' : 'Инцидент';
}

function init() {
    checkStatusProgram();
    checkTaskType();
}

function run() {
    getAutoRegStatus(onOffRegHandler);
}

//запуск
getConfig(run);