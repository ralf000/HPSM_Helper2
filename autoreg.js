// Глобальные переменные
var w = getActiveWindowByHPSM();
var backgroundDelay = 1000 * 20;
var waitTime;
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

//проходит по списку обращений/инцидентов
function tasksListIterator(filter) {
    const taskList = getRecordListByHPSM();

    return taskList
        .find('table.x-grid3-row-table')
        .filter(filter);
}

//ищет новые обращения/инциденты в списке в соответствии с ограничениями в настройках
function isNewTaskFilter(i, el) {
    let number = $(el).find('[id^="ext-gen-list"]').text().trim();
    const title = getTaskValueFromList(el, isNewHPSM() ? 'Заголовок' : 'Краткое описание');
    let priority = getTaskValueFromList(el, 'Приоритет').match(/\d+/);
   if (priority) {
       priority = priority[0];
   }
    const isNewStatus = isAppeal() ? 'Новое' : 'Направлен в группу';
    if (!$(el).find('div:contains("' + isNewStatus + '")').length) return false;
    //фильтруем талоны с превышенным количеством попыток их сохранить
    if (savingAttempts && savingAttempts[number] && savingAttempts[number] >= maxSavingAttempts) {
        sendExceededTaskNotificationMessage(number, priority, title, now());
        return false;
    }
    //шлем уведомление о регистрации обращения/инцидента
    sendNewTaskNotification(number, priority, title, now());
    //если для текущего приоритета талона стоит пометка "не регистрировать", то пропускаем его
    if (priority) {
        const isNotReg = isAppeal() ? appealNotReg[priority - 1] : incidentNotReg[priority - 1];
        if (isNotReg) {
            writeToLog(`Обращение/инцидент ${number} не будет зарегистрировано в соответствии с настройками`);
            return false;
        }
    }
    return true;
}

//возвращает номер ближайшего нового обращения/инцидента или false
function getNewTask() {
    const tasks = tasksListIterator(isNewTaskFilter);
    if (!tasks.length) return false;
    return tasks.first().find('[id^="ext-gen-list"]').text().trim();
}

function checkNewTask() {
    if (!isTasksList()) return registration();

    writeToLog('Проверяю наличие новых обращений/инцидентов');

    const newTaskNumber = getNewTask();
    if (newTaskNumber && isCorrectSearchEnvironment()) {
        findAndEnterToTask(newTaskNumber);
    } else {
        waitWithCorrectEnvironment();
    }
}

function findAndEnterToTask(number) {

    writeToLog(`Обнаружено новое обращение/инцидент ${number}`);

    chrome.extension.sendMessage({command: "newTask"}, function () {

        writeToLog(`Перехожу к регистрации ${number}`);

        const task = tasksListIterator((i, el) => $(el).find('a').text() === number);
        if (task.length) task.find('a')[0].click();
    });
}

function getTaskValueFromList(task, header) {
    const frame = getActiveFrameByHPSM();
    const index = frame.find('.x-grid3-header').find('.x-grid3-hd-inner:contains("' + header + '")').closest('td').index();
    return $(task).find(`.x-grid3-td-${index}`).text().trim();
}

/**
 * Переходит в режим ожидания новый обращений/инцидентов
 * попутно устанавливая сохраняя/устанавливает очередь и представление
 * которые были выбраны при старте
 */
function waitWithCorrectEnvironment() {
    if (initRegistration && initRegistration === 'on') {
        removeSavedParam('initRegistration');
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
        setSavedParam({queueName: queue});
        setSavedParam({representationName: representation});
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

function isCorrectSearchEnvironment() {
    return (!queueName || getQueue() === queueName) && (!representationName || getRepresentation() === representationName);
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

        var toWorkBtn = isAppeal() ? w.find('button:contains("Передать Инженеру")') : w.find('button:contains("В работу")');
        var OKBtn = w.find('button:contains("ОК")');

        if (isNewHPSM()) {
            toWorkBtn = isAppeal() ? w.find('button:contains("Передать Инженеру")') : w.find('button:contains("Взять в работу")');
            OKBtn = w.find('button:contains("Возврат")');
        }
        var cancelBtn = w.find('button:contains("Отмена")');

        const status = getStatus();
        if ((status !== statusNew && status !== 'Направлен в группу') || !toWorkBtn.length) {
            //шлет уведомление о регистрации обращения/инцидента
            // sendNewTaskNotification(number, title, now());
            writeToLog('Выход из регистрации обращения');

            if (cancelBtn.length) {
                writeToLog('Нажимаю на кнопку: Отмена');
                return cancelBtn.click();
            }
            if (OKBtn.length) {
                writeToLog('Нажимаю на кнопку: ОК/Возврат');
                return OKBtn.click();
            }
            return writeToLog('Ошибка: не найдено кнопок для выхода из зарегистрированного обращения/инцидента');
        }

        writeToLog('Регистрирую обращение/инцидент под номером ' + number);

        if (toWorkBtn.length) {
            return setSavingAttempts(
                number,
                () => {
                    writeToLog('Нажимаю на кнопку: В работу/Взять в работу');
                    toWorkBtn.click()
                },
                () => {
                    writeToLog(`Превышено количество попыток сохранения талона ${number}. Нажимаю на кнопку: Отмена`);
                    const priority = getPriority();
                    sendExceededTaskNotificationMessage(number, priority, title, now());
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

function getCommandFromBackground() {
    removeSavedParam('todo');
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