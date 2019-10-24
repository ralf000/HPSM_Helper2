var emailUrl = 'https://utilites.2hut.ru/hpsm_helper/send-email.php';
var logUrl = 'https://utilites.2hut.ru/hpsm_helper/log.php';

function handleContinuePage() {
    writeToLog('Сессия истекла. Возвращаюсь на страницу со списком инцидентов/обращений');

    chrome.extension.sendMessage({command: "checkingOnEntryPage", delay: 1000 * 60});

    if (loginHPSM) {
        $('#LoginUsername').val(loginHPSM);
    }
    if (passwordHPSM) {
        $('#LoginPassword').val(passwordHPSM);
    }
    setTimeout(function () {
        return $('#btnContinue').length
            ? $('#btnContinue')[0].click()
            : $('#loginBtn').click();
    }, 300);
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
    return getRecordListByHPSM();
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
    var form = getActiveFormByHPSM();
    if (form.find('input[name="instance/hpc.status"]').length === 0)
        return null;

    return form.find('input[name="instance/hpc.status"]').val()
}

function getHPSMTabId(callback) {
    chrome.storage.sync.get('hpsmTab', function (result) {
        var hpsmTab = result.hpsmTab;
        return callback(hpsmTab);
    });
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
                        <img src="http://utilites.2hut.ru/loading.gif" style="width: 400px" alt="">\
                        Авторегистрация<br>\
                    </span>\
                </div>';
}

function clean() {
    chrome.storage.sync.remove('registration');
    chrome.storage.sync.remove('todo');
    chrome.storage.sync.remove('hpsmTab');
    chrome.storage.sync.remove('handlingContinuePage');
}

function getAutoRegStatus(callback) {
    chrome.storage.sync.get('registration', function (result) {
        var registration = result.registration;
        return callback(registration);
    });
}

/**
 * Получает количество попыток регистрации
 * @param callback
 */
function getRegistrationAttemptsAmount(callback) {
    chrome.storage.sync.get('registrationAttempts', function (result) {
        registrationAttempts = result.registrationAttempts || 0;
        return callback(registrationAttempts);
    });
}

/**
 * Получает время обновлений списка обращений/инцидентов
 * @param callback
 */
function getUpdateTasksTime(callback) {
    chrome.storage.sync.get('updateTasksTime', function (result) {
        var updateTasksTime = result.updateTasksTime;
        if (updateTasksTime) {
            waitTime = updateTasksTime * 1000 * 60 - backgroundDelay;
        }
        return callback(updateTasksTime);
    });
}

/**
 * Получает установленную очередь для поиска обращений/инцидентов
 */
function getQueue() {
    var form = getActiveFormByHPSM();
    var queueInput = $(form.find('#X4'));
    return queueInput.length ? queueInput.val() : '';
}

/**
 * Получает установленное представление для поиска обращений/инцидентов
 */
function getRepresentation() {
    var form = getActiveFormByHPSM();
    var representationInput = $(form.find('#X6'));
    return representationInput.length ? representationInput.val() : '';
}

function getLoginHPSM(callback) {
    chrome.storage.sync.get('loginHPSM', function (result) {
        loginHPSM = result.loginHPSM;
        return callback(loginHPSM);
    });
}

function getPasswordHPSM(callback) {
    chrome.storage.sync.get('passwordHPSM', function (result) {
        passwordHPSM = result.passwordHPSM;
        return callback(passwordHPSM);
    });
}

function getAlertEmail(callback) {
    chrome.storage.sync.get('email', function (result) {
        alertEmail = result.email;
        return callback(alertEmail);
    });
}

function getAlertEmailPassword(callback) {
    chrome.storage.sync.get('password', function (result) {
        alertEmailPassword = result.password;
        return callback(alertEmailPassword);
    });
}

function getInitRegistrationTag(callback) {
    chrome.storage.sync.get('initRegistration', function (result) {
        initRegistration = result.initRegistration;
        return callback(initRegistration);
    });
}

function getSavedQueueName(callback) {
    chrome.storage.sync.get('queueName', function (result) {
        queueName = result.queueName;
        return callback(queueName);
    });
}

function getSavedRepresentationName(callback) {
    chrome.storage.sync.get('representationName', function (result) {
        representationName = result.representationName;
        return callback(representationName);
    });
}

function getTodo(callback) {
    chrome.storage.sync.get('todo', function (result) {
        todo = result.todo;
        return callback(todo);
    });
}

/**
 * Получает конфиг расширения
 * @param callback
 */
function getConfig(callback) {
    getUpdateTasksTime(function () {
        getRegistrationAttemptsAmount(function () {
            getLoginHPSM(function () {
                getPasswordHPSM(function () {
                    getAlertEmail(function () {
                        getAlertEmailPassword(function () {
                            getInitRegistrationTag(function () {
                                getSavedQueueName(function () {
                                    getSavedRepresentationName(function () {
                                        getTodo(function () {
                                            setTimeout(callback, delay * 3);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function sendEmailViaAjax(url, number, title, date, email, password) {
    $.ajax({
        url: url,
        type: "POST",
        dataType: 'json',
        data: {number: number, title: title, date: date, email: email, password: password},
        success: function (data) {
            if (data.status === 'success') {
                console.log(now() + ' ' + data.message);
            } else {
                console.error(now() + ' ' + data.message)
            }
        },
        error: function (data) {
            console.error(data);
        }
    });
}

function writeToLog(message, url, date) {
    date = date || now();
    url = url || logUrl;

    console.log(date + ': ' + message);

    if (alertEmailPassword.length) {
        if (alertEmail.length) {
            $.ajax({
                url: url,
                type: "POST",
                dataType: 'json',
                data: {type: 'write', message: message, email: alertEmail, password: alertEmailPassword, date: date},
                success: function (data) {
                    if (data.status === 'success') {
                    } else {
                        console.error(now() + ' ' + data.message)
                    }
                },
                error: function (data) {
                    console.error(data);
                }
            });
        } else {
            console.info(now() + ' Не введен email для отправки писем');
        }
    } else {
        console.info(now() + ' Не введен пароль для отправки писем');
    }
}

/**
 * Отправляет логи на почту
 * @param url
 */
function sendLog(url) {
    if (alertEmailPassword.length) {
        if (alertEmail.length) {
            return sendLogsToEmail(url, alertEmailPassword, alertEmail)
        } else {
            console.info(now() + ' Не введен email для отправки писем');
        }
    } else {
        console.info(now() + ' Не введен пароль для отправки писем');
    }
}

function sendLogsToEmail(url, password, email, onSuccessCallback) {
    $.ajax({
        url: url,
        type: "POST",
        dataType: 'json',
        data: {type: 'read', password: password, email: email},
        success: function (data) {
            if (data.status === 'success') {
                console.log(now() + ' ' + data.message);
                $('#sendLogs').text(data.message);
            } else {
                console.error(now() + ' ' + data.message)
            }
        },
        error: function (data) {
            console.error(data);
        }
    });
}

function sendEmail(url, number, title, date) {
    if (alertEmailPassword.length) {
        if (alertEmail.length) {
            console.log(now() + ' Отправка письма об авторегистрации обращения/инцидента ' + number + ' на адрес ' + alertEmail);
            return sendEmailViaAjax(url, number, title, date, alertEmail, alertEmailPassword)
        } else {
            console.info(now() + ' Не введен email для отправки писем');
        }
    } else {
        console.info(now() + ' Не введен пароль для отправки писем');
    }
}

function now() {
    return (new Date().toLocaleString());
}