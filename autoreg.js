// Глобальные переменные
var w = getActiveWindowByHPSM();
var taskList = getRecordListByHPSM();
var waitTime = 1000 * 60 * 10;
var delay = 1000;
var start = new Date();
var intValId;
var taskType = '';
var emailUrl = 'https://utilites.2hut.ru/hpsm_helper/send-email.php';

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
            console.log(w.find('button:contains("Обновить")'));
            if (w.find('button:contains("Обновить")').length) {
                console.log(now() + ' Обновляю список обращений/инцидентов"');
                w.find('button:contains("Обновить")').click();
                //location.reload();
            } else {
                w.find('button:contains("ОК")').click()
            }
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
        console.log(now() + ' Сессия истекла. Возвращаюсь на страницу со списком инцидентов/обращений');
        return $('#btnContinue')[0].click()
    }
    if (!isTasksList()) return registration();

    console.log(now() + ' Проверяю наличие новых обращений/инцидентов');

    if (isNewTask()) {

        console.log(now() + ' Обнаружено новое обращение/инцидент');

        chrome.extension.sendMessage({command: "newTask"}, function () {

            console.log(now() + ' Перехожу к регистрации');

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
    return wait();
}


function registration() {
    if (isTasksList()) return checkNewTask();

    console.log(now() + ' Регистрация обращения/инцидента в процессе');

    clearInterval(intValId);
    chrome.extension.sendMessage({command: "waitNewTask"}, function () {

        setTimeout(function () {
            console.log(now() + ' Статус обращения/инцидента: ' + getStatus());

            if ($('#commonMsg').text().indexOf('Обновляемая запись с момента считывания была изменена') !== -1) {
                w.find('button:contains("Обновить")').click();
            }

            if ((getStatus() !== 'Новое' && getStatus() !== 'Направлен в группу')
                || (w.find('button:contains("Передать Инженеру")').length === 0 && w.find('button:contains("В работу")').length === 0)
            ) {
                console.log(now() + ' Выход из регистрации обращения');
                return w.find('button:contains("ОК")').click();
            }
            var form = getActiveFormByHPSM();

            var number = '';
            if (form.find('[ref="instance/incident.id"] span').length !== 0) {
                number = form.find('[ref="instance/incident.id"] span').text();
                console.log(now() + ' Регистрирую обращение/инцидент под номером ' + number);
            }

            var resolution = form.find('textarea[name="instance/resolution/resolution"]');
            if (resolution.length)
                resolution.val('АвтоРегистрация: ' + now());

            var title = form.find('input[name="instance/title"]');
            if (!title.length)
                title = form.find('input[name="instance/brief.description"]');
            if (!title.val().length) {
                title.val('Тема письма не заполнена');
            }

            //sendEmail(number, title, now());

            return (w.find('button:contains("Передать Инженеру")').length !== 0)
                ? w.find('button:contains("Передать Инженеру")').click()
                : w.find('button:contains("В работу")').click();
        }, delay * 5);

    });
}

function getCommandFromBackground() {
    console.log(now() + ' Получаю команду');
    chrome.storage.sync.get('todo', function (result) {
        var todo = result.todo;
        if (todo === 'regInProcess') {
            registration();
        } else if (todo === 'reloadAutoreg') {
            chrome.storage.sync.remove('todo');
            setTimeout(function () {
                console.log(now() + ' Перезапуская авторегистрацию после истечения сессии');
                run();
            }, delay);
        } else {
            checkNewTask();
        }
    });
}

function sendEmailViaAjax(number, title, date, email, password) {
    $.ajax({
        url: emailUrl,
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

function sendEmail(number, title, date) {
    chrome.storage.sync.get('password', function (result) {
        if (result.password.length) {
            var password = result.password;
            chrome.storage.sync.get('email', function (result) {
                if (result.email.length) {
                var email = result.email;
                    sendEmailViaAjax(number, title, date, email, password)
                }
            });
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
