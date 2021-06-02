function addHandlers() {
    $('#autoReg').on('click', function () {
        chrome.storage.sync.remove('todo');
        if ($(this).prop('checked')) {
            chrome.storage.sync.set({registration: 'on'});
            chrome.storage.sync.set({initRegistration: 'on'});
            chrome.tabs.executeScript(null, {file: 'autoreg.js'});
            setTimeout(function () {
                window.close();
            }, 500);
        } else {
            chrome.storage.sync.set({registration: 'off'});
        }
    });

    $('a[data-target]').click(function (e) {
        e.preventDefault();
        $($(this).data('target')).slideToggle();
    });

    $('#save-email').on('click', function (e) {
        e.preventDefault();
        var email = $('#email-input').val();
        if (!email.length) return;
        chrome.storage.sync.set({email: email});
        $(this).css({'background-color': 'green'})
    });

    $('#save-password').on('click', function (e) {
        e.preventDefault();
        var password = $('#password-input').val();
        chrome.storage.sync.set({password: password});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-login').on('click', function (e) {
        e.preventDefault();
        var login = $('#login-hpsm-input').val();
        if (!login.length) return;
        chrome.storage.sync.set({loginHPSM: login});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-password').on('click', function (e) {
        e.preventDefault();
        var password = $('#password-hpsm-input').val();
        if (!password.length) return;
        chrome.storage.sync.set({passwordHPSM: password});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-new-login').on('click', function (e) {
        e.preventDefault();
        var login = $('#login-hpsm-new-input').val();
        if (!login.length) return;
        chrome.storage.sync.set({loginNewHPSM: login});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-new-password').on('click', function (e) {
        e.preventDefault();
        var password = $('#password-hpsm-new-input').val();
        if (!password.length) return;
        chrome.storage.sync.set({passwordNewHPSM: password});
        $(this).css({'background-color': 'green'})
    });

    $('#save-time').on('click', function (e) {
        e.preventDefault();
        var time = $('#time-input').val();
        if (!time.length) return;
        chrome.storage.sync.set({updateTasksTime: time});
        $(this).css({'background-color': 'green'})
    });
}

function setAutoRegStatus() {
    chrome.storage.sync.get('registration', function (result) {
        var registration = result.registration;
        var checker = $('#autoReg');
        if (registration === 'on')
            checker.prop('checked', true);
        else
            checker.prop('checked', false);
    });
}

function appendBtns(data, status) {
    if (status === 'success') {
        var colors = ['blue', 'green', 'red', 'purple', 'orange', 'yellow'];
        var btns = $('#btns');
        for (var key in data) {
            btns.append('<button id="' + key + '" class="btn ' + colors[key] + '">' + data[key][0] + '</button>');
            //обработчики кнопок
            $('#' + key).on('click', function (e) {
                e.preventDefault();
                var id = $(this).attr('id');
                chrome.storage.sync.set({taskData: data[id]});
                chrome.tabs.executeScript(null, {file: 'task-filler.js'});
            });
        }
    }
}

function saveCurrentTab() {
    chrome.tabs.getSelected(null, function (tab) {
        if (tab.url
            && (tab.url.indexOf('sm.mos') === -1
                && tab.url.indexOf('sm.eaist.mos') === -1
                && tab.url.indexOf('sm.tender.mos') === -1
                && tab.url.indexOf('212.11.152.7') === -1)
        ) {
            return false;
        }
        chrome.storage.sync.get('registration', function (result) {
            var registration = result.registration;
            if (registration !== 'on') {
                chrome.storage.sync.set({hpsmTab: tab.id});
            }
        });
    });
}


function fillFields() {
    chrome.storage.sync.get('email', function (result) {
        if (result.email) {
            $('#email-input').val(result.email);
            $('#save-email').css({'background-color': 'green'});
        }
    });
    chrome.storage.sync.get('password', function (result) {
        if (result.password) {
            $('#password-input').val(result.password);
            $('#save-password').css({'background-color': 'green'});
        }
    });
    chrome.storage.sync.get('loginHPSM', function (result) {
        if (result.loginHPSM) {
            $('#login-hpsm-input').val(result.loginHPSM);
            $('#save-hpsm-login').css({'background-color': 'green'});
        }
    });
    chrome.storage.sync.get('passwordHPSM', function (result) {
        if (result.passwordHPSM) {
            $('#password-hpsm-input').val(result.passwordHPSM);
            $('#save-hpsm-password').css({'background-color': 'green'});
        }
    });
    chrome.storage.sync.get('passwordNewHPSM', function (result) {
        if (result.passwordNewHPSM) {
            $('#password-hpsm-new-input').val(result.passwordNewHPSM);
            $('#save-hpsm-new-password').css({'background-color': 'green'});
        }
    });
    chrome.storage.sync.get('loginNewHPSM', function (result) {
        if (result.loginNewHPSM) {
            $('#login-hpsm-new-input').val(result.loginNewHPSM);
            $('#save-hpsm-new-login').css({'background-color': 'green'});
        }
    });
    chrome.storage.sync.get('updateTasksTime', function (result) {
        if (result.updateTasksTime) {
            $('#time-input').val(result.updateTasksTime);
            $('#save-time').css({'background-color': 'green'});
        }
    });
}


function init() {
    $.getJSON('data.json', appendBtns);
    addHandlers();
    setAutoRegStatus();
    saveCurrentTab();
    fillFields();
}


$(function () {
    init();
});