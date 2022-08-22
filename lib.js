var statusNew = 'Новое';
var statusOld = 'Зарегистрированное';

function setSavedParam(data) {
    chrome.storage.sync.set(data);
}

function getSavedParam(name, callback) {
    chrome.storage.sync.get(name, callback);
}

function removeSavedParam(name) {
    chrome.storage.sync.remove(name);
}

function handleContinuePage() {
    writeToLog('Сессия истекла. Возвращаюсь на страницу со списком инцидентов/обращений');

    chrome.extension.sendMessage({command: "checkingOnEntryPage", delay: 1000 * 60});

    handleLoginPage();

    setTimeout(function () {
        return $('#btnContinue').length
            ? $('#btnContinue')[0].click()
            : $('#loginBtn').click();
    }, 300);
}


function isAppeal() {
    return taskType === 'Обращение';
}

function isIncident() {
    return taskType !== 'Обращение';
}

//приоритет
function getPriority() {
    const form = getActiveFormByHPSM();
    let priority = form.find('span[ref="instance/priority.code"]').children('span').text()
        || form.find('input[name="instance/priority.code"]').val()
        || form.find('input[alias="instance/priority.code"]').val();

    return priority ? priority.match(/\d+/)[0] : priority;
}

function isCorrectTelegramNotificationSettings() {
    if (isAppeal() && (!appealsTag || !tgAppealBotApiToken || !tgAppealChatId)) return false;
    if (isIncident() && (!incidentsTag || !tgIncidentBotApiToken || !tgIncidentChatId)) return false;

    return true;
}

function isAllowedToSendNewTaskNotification(number, priority) {
    if ($.inArray(number, newTaskSentMessages) !== -1) return false;
    if (!isCorrectTelegramNotificationSettings()) return false;

    if (!priority) return false;

    const allowedPriority = isAppeal() ? appealNotifications[priority - 1] : incidentNotifications[priority - 1];
    if (!allowedPriority) {
        writeToLog(`Оповещение об обнаружении обращения/инцидента ${number} не будет отправлено в телеграмм в соответствии с настройками`);
        return false;
    }
    return true;
}

function isAllowedToSendExceededTaskNotification(number) {
    if (!isCorrectTelegramNotificationSettings()) return false;
    return $.inArray(number, exceededTaskSentMessages) !== -1;
}

/**
 * Возращает id для активного окна, вычисляемый по активной вкладке
 * @returns string|null id
 */
function getActiveTabIdByHPSM() {
    var tabActive = $('ul.x-tab-strip-top li.x-tab-strip-active');
    if (tabActive.length === 0)
        return null;
    var id = tabActive.attr('id');
    id = id.split('__');
    return id[id.length - 1];
}

/**
 * Возвращает активную область
 * @returns object jquery active area
 */
function getActiveWindowByHPSM() {
    var tabId = getActiveTabIdByHPSM();
    return (tabId && tabId.length > 0) ? $('.x-tab-panel-bwrap').find('#' + tabId) : $('.x-tab-panel-bwrap');
}

/**
 * Возвращает активный iframe
 * @returns object jquery iframe
 */
function getActiveFrameByHPSM() {
    var w = getActiveWindowByHPSM();
    return (w) ? w.find('iframe').contents() : false;
}

/**
 * Получает номер обращения/инцидента
 */
function getNumber() {
    var form = getActiveFormByHPSM();

    var number = 'Неизвестный номер';
    if (form.length && form.find('[ref="instance/incident.id"] span').length) {
        number = form.find('[ref="instance/incident.id"] span').text();
    } else if (form.length && form.find('#keyValues').length) {
        number = form.find('#keyValues').val();
    }
    return number;
}

/**
 * Получает заголовок обращения/инцидента
 */
function getTitle() {
    var form = getActiveFormByHPSM();

    var title = 'Тема письма не заполнена';
    if (form.length && form.find('input[name="instance/title"]').length && form.find('input[name="instance/title"]').val().length) {
        title = form.find('input[name="instance/title"]').val();
    } else if (form.length && form.find('input[name="instance/brief.description"]').length && form.find('input[name="instance/brief.description"]').val().length) {
        title = form.find('input[name="instance/brief.description"]').val();
    }
    return title;
}

/**
 * Возвращает активную форму
 * @returns object jquery active form
 */
function getActiveFormByHPSM() {
    var frame = getActiveFrameByHPSM();
    return (frame.find('form#topaz').length > 0)
        ? frame.find('form#topaz')
        : frame.contents().find('iframe.ux-mif').contents().find('form#topaz');
}

function getRecordListByHPSM() {
    var frame = getActiveFrameByHPSM();
    return (frame.find('#recordList').length !== 0) ? frame.find('#recordList') : false;
}

function isTasksList() {
    var recordsList = getRecordListByHPSM();
    return recordsList && getRecordListByHPSM().length !== 0;
}

/**
 * Страница с кнопкой "Продолжить" или "Войти в систему"
 * @returns bool
 */
function isContinuePage() {
    return $('#btnContinue').length || $('#loginBtn').length;
}

/**
 * Возвращает статус обращения/инцидента
 * @returns string|null Task status
 */
function getStatus() {
    if (isNewHPSM()) {
        return w.find('button:contains("Взять в работу")').length ? statusNew : statusOld;
    }
    var form = getActiveFormByHPSM();
    if (form.find('input[name="instance/hpc.status"]').length === 0)
        return null;

    return form.find('input[name="instance/hpc.status"]').val()
}

function getTopLayer() {
    return '<div id="toplayer" style="\
                position: fixed;\
                top: 0;\
                right: 0;\
                left: 0;\
                bottom: 0;\
                z-index: 9999999;\
                opacity: .8;\
                background-color: #fff;">\
                    <span style="\
                    margin: auto;\
                    display: flex;\
                    flex-flow: column;\
                    left: 50px;\
                    color: black;\
                    font-size: 16px;\
                    position: relative;\
                    -webkit-box-align: center;\
                    -ms-flex-align: center;\
                    align-items: center;\
                    justify-content: center;\
                    transition: transform .3s ease-out,-webkit-transform .3s ease-out;\
                    min-height: calc(100% - (1.75rem * 2))">\
                        <img src="https://utilites.2hut.ru/loading.gif" style="width: 400px" alt="">\
                        Авторегистрация<br>\
                    </span>\
                </div>';
}

function isNewHPSM() {
    return location.href.indexOf('https://sm.eaist.mos.ru') !== -1
        || location.href.indexOf('https://sm.tender.mos.ru') !== -1
        || location.href.indexOf('212.11.152.7') !== -1;
}

function clean() {
    removeSavedParam('registration');
    removeSavedParam('todo');
    removeSavedParam('handlingContinuePage');
    removeSavedParam('savingAttempts');
}

function setSavingAttempts(number, successCallback, errorCallback) {
    let callback = successCallback;
    if (!savingAttempts[number]) {
        savingAttempts[number] = 1;
    } else if (savingAttempts[number] < maxSavingAttempts) {
        savingAttempts[number] += 1;
    } else {
        savingAttempts[number] += 1;
        callback = errorCallback;
    }
    setSavedParam({savingAttempts: savingAttempts});
    callback();
}

/**
 * Получает установленную очередь для поиска обращений/инцидентов
 */
function getQueue() {
    var form = getActiveFormByHPSM();
    var queueInput = isNewHPSM() ? $(form.find('#X5')) : $(form.find('#X4'));
    return queueInput.length ? queueInput.val() : '';
}

/**
 * Получает установленное представление для поиска обращений/инцидентов
 */
function getRepresentation() {
    var form = getActiveFormByHPSM();
    var representationInput = isNewHPSM() ? $(form.find('#X7')) : $(form.find('#X6'));
    return representationInput.length ? representationInput.val() : '';
}

function getAutoRegStatus(callback) {
    getSavedParam('registration', function (result) {
        var registration = result.registration;
        return callback(registration);
    });
}

/**
 * Получает время обновлений списка обращений/инцидентов
 * @param callback
 */
async function getUpdateTasksTime(callback) {
    return await new Promise(
        resolve => getSavedParam(
            'updateTasksTime',
            result => resolve(result.updateTasksTime)
        )
    );
}

async function getLoginHPSM() {
    return await new Promise(resolve => getSavedParam('loginHPSM', result => resolve(result.loginHPSM)))
}

async function getPasswordHPSM() {
    return await new Promise(resolve => getSavedParam('passwordHPSM', result => resolve(result.passwordHPSM)))
}

async function getLoginNewHPSM() {
    return await new Promise(resolve => getSavedParam('loginNewHPSM', result => resolve(result.loginNewHPSM)))
}

async function getPasswordNewHPSM() {
    return await new Promise(resolve => getSavedParam('passwordNewHPSM', result => resolve(result.passwordNewHPSM)))
}

async function getInitRegistrationTag() {
    return await new Promise(resolve => getSavedParam('initRegistration', result => resolve(result.initRegistration)))
}

async function getSavedQueueName() {
    return await new Promise(resolve => getSavedParam('queueName', result => resolve(result.queueName)))
}

async function getSavedRepresentationName() {
    return await new Promise(resolve => getSavedParam('representationName', result => resolve(result.representationName)))
}

async function getTodo() {
    return await new Promise(resolve => getSavedParam('todo', result => resolve(result.todo)))
}

async function getSavingAttempts() {
    return await new Promise(resolve => getSavedParam('savingAttempts', result => resolve(result.savingAttempts)))
}

/**
 * Получает метку, сигнализирующую, что нужно применять некоторое особое поведение при регистрации обращений
 */
async function getAppealsTag() {
    return await new Promise(resolve => getSavedParam('appealsTag', result => resolve(result.appealsTag)))
}

/**
 * Получает метку, сигнализирующую, что нужно применять некоторое особое поведение при регистрации инцидентов
 */
async function getIncidentsTag() {
    return await new Promise(resolve => getSavedParam('incidentsTag', result => resolve(result.incidentsTag)))
}

/**
 * Уровни обращений для отправки уведомлений
 */
async function getAppealNotifications() {
    return await new Promise(resolve => getSavedParam('appealNotifications', result => resolve(result.appealNotifications)))
}

/**
 * Уровни инцидентов для отправки уведомлений
 */
async function getIncidentNotifications() {
    return await new Promise(resolve => getSavedParam('incidentNotifications', result => resolve(result.incidentNotifications)))
}

/**
 * Уровни обращений для отключения авторегистрации
 */
async function getAppealNotReg() {
    return await new Promise(resolve => getSavedParam('appealNotReg', result => resolve(result.appealNotReg)))
}

/**
 * Уровни инцидентов для отключения авторегистрации
 */
async function getIncidentNotReg() {
    return await new Promise(resolve => getSavedParam('incidentNotReg', result => resolve(result.incidentNotReg)))
}

/**
 * токен бота тг для отправки оповещений об обращениях
 */
async function getTgAppealBotApiToken() {
    return await new Promise(resolve => getSavedParam('tgAppealBotApiToken', result => resolve(result.tgAppealBotApiToken)))
}

/**
 * id чата тг для отправки оповещений об обращениях
 */
async function getTgAppealChatId() {
    return await new Promise(resolve => getSavedParam('tgAppealChatId', result => resolve(result.tgAppealChatId)))
}

/**
 * токен бота тг для отправки оповещений об инцидентах
 */
async function getTgIncidentBotApiToken() {
    return await new Promise(resolve => getSavedParam('tgIncidentBotApiToken', result => resolve(result.tgIncidentBotApiToken)))
}

/**
 * id чата тг для отправки оповещений об инцидентах
 */
async function getTgIncidentChatId() {
    return await new Promise(resolve => getSavedParam('tgIncidentChatId', result => resolve(result.tgIncidentChatId)))
}

/**
 * список обращений/инцидентов с превышенным количеством попыток сохранения и отправленным оповещением об этом
 */
async function getNewTaskSentMessages() {
    return await new Promise(resolve => getSavedParam('newTaskSentMessages', result => resolve(result.newTaskSentMessages)))
}

/**
 * список обращений/инцидентов с превышенным количеством попыток сохранения и отправленным оповещением об этом
 */
async function getExceededTaskSentMessages() {
    return await new Promise(resolve => getSavedParam('exceededTaskSentMessages', result => resolve(result.exceededTaskSentMessages)))
}

/**
 * Получает конфиг расширения
 * @param callback
 */
async function getConfig(callback) {
    waitTime = await getUpdateTasksTime() || 10;
    waitTime = waitTime * 1000 * 60 - backgroundDelay;
    loginHPSM = await getLoginHPSM();
    passwordHPSM = await getPasswordHPSM();
    loginNewHPSM = await getLoginNewHPSM();
    passwordNewHPSM = await getPasswordNewHPSM();
    initRegistration = await getInitRegistrationTag();
    queueName = await getSavedQueueName();
    representationName = await getSavedRepresentationName();
    todo = await getTodo();
    savingAttempts = await getSavingAttempts() || {};
    appealsTag = await getAppealsTag();
    incidentsTag = await getIncidentsTag();
    appealNotifications = await getAppealNotifications() || [];
    incidentNotifications = await getIncidentNotifications() || [];
    appealNotReg = await getAppealNotReg() || [];
    incidentNotReg = await getIncidentNotReg() || [];
    tgAppealBotApiToken = await getTgAppealBotApiToken();
    tgIncidentBotApiToken = await getTgIncidentBotApiToken();
    tgAppealChatId = await getTgAppealChatId();
    tgIncidentChatId = await getTgIncidentChatId();
    newTaskSentMessages = await getNewTaskSentMessages() || [];
    exceededTaskSentMessages = await getExceededTaskSentMessages() || [];
    setTimeout(callback, delay * 3);
}

function getTelegramUrl() {
    const appeal = isAppeal();
    const botToken = appeal ? tgAppealBotApiToken : tgIncidentBotApiToken;
    return `https://api.telegram.org/bot${botToken}/sendMessage`;
}

function getNewTaskTelegramMessage(number, priority, title, date) {
    const appeal = isAppeal();
    const chatId = appeal ? tgAppealChatId : tgIncidentChatId;
    const text1 = appeal ? 'Новое' : 'Новый';
    const taskName = appeal ? 'обращение' : 'инцидент';
    const text2 = appeal ? 'Данное' : 'Данный';
    priority = priority || getPriority();
    let isRegistered = '';
    if (appeal && appealNotReg[priority - 1]) {
        isRegistered = ` ${text2} ${taskName} не зарегистрировано.`;
    } else if (!appeal && incidentNotReg[priority - 1]) {
        isRegistered = ` ${text2} ${taskName} не зарегистрирован.`;
    }
    const text = `${text1} ${taskName}.\n<b>Номер</b>: ${number}.\n<b>Название</b>: ${title}.\n<b>Приоритет</b>: ${priority}.\n${isRegistered}\n`;

    return {chat_id: chatId, text: text, parse_mode: 'html'};
}

function getExceededTaskTelegramMessage(number, priority, title, date) {
    const appeal = isAppeal();
    const chatId = appeal ? tgAppealChatId : tgIncidentChatId;
    const taskName = appeal ? 'обращения' : 'инцидента';
    const text = `<b>Превышено количество попыток регистрации ${taskName}</b>.\n<b>Номер</b> ${number}.\n<b>Название</b>: ${title}.<b>Приоритет</b>: ${priority}.\n`;
    return {chat_id: chatId, text: text, parse_mode: 'html'};
}

function doSendNotification(message, successCallback, errorCallback) {
    $.ajax({
        url: getTelegramUrl(),
        type: "POST",
        dataType: 'json',
        data: message,
        success: function (data) {
            if (data.ok) {
                if (successCallback) return successCallback();
            }
            if (errorCallback) return errorCallback();
        },
        error: function (data) {
            console.error(data.responseJSON);
            if (errorCallback) return errorCallback();
        }
    });
}

function writeToLog(message, url, date) {
    date = date || now();
    console.log(`${date}: ${message}`);
}

function sendNewTaskNotification(number, priority, title, date) {
    if (!isAllowedToSendNewTaskNotification(number, priority)) {
        return false;
    }

    writeToLog(`Отправка оповещения об обнаружении обращения/инцидента ${number}`);

    newTaskSentMessages.push(number);
    setSavedParam({newTaskSentMessages: newTaskSentMessages});

    const message = getNewTaskTelegramMessage(number, priority, title, date);
    return doSendNotification(message);
}

function sendExceededTaskNotificationMessage(number, priority, title, date) {
    if (!isAllowedToSendExceededTaskNotification(number)) return false;

    writeToLog(`Отправка оповещения об обнаружении превышения попыток регистрации обращения/инцидента ${number}`);

    const message = getExceededTaskTelegramMessage(number, priority, title, date);
    const onSuccess = () => {
        exceededTaskSentMessages.push(number);
        setSavedParam({exceededTaskSentMessages: exceededTaskSentMessages});
    }
    doSendNotification(message, onSuccess);
}

function now() {
    return (new Date().toLocaleString());
}