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
        chrome.storage.sync.set({loginHPSM: login});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-password').on('click', function (e) {
        e.preventDefault();
        var password = $('#password-hpsm-input').val();
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
        chrome.storage.sync.set({updateTasksTime: time});
        $(this).css({'background-color': 'green'})
    });

    $('.levels-trigger').click(e => $(e.target).siblings('.levels-block').slideToggle());

    $('input[name="appeals-tag"]').on('click', function () {
        const state = $(this).is(':checked');
        chrome.storage.sync.set({appealsTag: state});
    });

    $('input[name="incidents-tag"]').on('click', function () {
        const state = $(this).is(':checked');
        chrome.storage.sync.set({incidentsTag: state});
    });

    $('input[name^="appeal.notifications"]').on('click', function () {
        const states = $('input[name^="appeal.notifications"]').map((i, el) => $(el).is(':checked')).toArray();
        const checked = states.reduce((prev, current) => prev || current);
        const tgSettings = $('.tg-appeal-notification-settings');
        checked ? tgSettings.slideDown() : tgSettings.slideUp();
        chrome.storage.sync.set({appealNotifications: states});
    });

    $('input[name^="incident.notifications"]').on('click', function () {
        const states = $('input[name^="incident.notifications"]').map((i, el) => $(el).is(':checked')).toArray();
        const checked = states.reduce((prev, current) => prev || current);
        const tgSettings = $('.tg-incident-notification-settings');
        checked ? tgSettings.slideDown() : tgSettings.slideUp();
        chrome.storage.sync.set({incidentNotifications: states});
    });

    $('input[name^="appeal.not-reg"]').on('click', function () {
        const states = $('input[name^="appeal.not-reg"]').map((i, el) => $(el).is(':checked'));
        chrome.storage.sync.set({appealNotReg: states});
    });

    $('input[name^="incident.not-reg"]').on('click', function () {
        const states = $('input[name^="incident.not-reg"]').map((i, el) => $(el).is(':checked'));
        chrome.storage.sync.set({incidentNotReg: states});
    });

    $('input[name^="appeal.to-work"]').on('click', function () {
        const states = $('input[name^="appeal.to-work"]').map((i, el) => $(el).is(':checked'));
        chrome.storage.sync.set({appealToWork: states});
    });

    $('input[name^="incident.to-work"]').on('click', function () {
        const states = $('input[name^="incident.to-work"]').map((i, el) => $(el).is(':checked'));
        chrome.storage.sync.set({incidentToWork: states});
    });

    $('#tg-appeal-bot-api_token-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-appeal-bot-api_token').val();
        chrome.storage.sync.set({tgAppealBotApiToken: value});
        $(this).css({'background-color': 'green'})
    });

    $('#tg-appeal-chat_id-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-appeal-chat_id').val();
        chrome.storage.sync.set({tgAppealChatId: value});
        $(this).css({'background-color': 'green'})
    });

    $('#tg-incident-bot-api_token-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-incident-bot-api_token').val();
        chrome.storage.sync.set({tgIncidentBotApiToken: value});
        $(this).css({'background-color': 'green'})
    });

    $('#tg-incident-chat_id-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-incident-chat_id').val();
        chrome.storage.sync.set({tgIncidentChatId: value});
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
    chrome.storage.sync.get(
        'appealsTag',
        result => $('input[name="appeals-tag"]')
            .prop('checked', result.appealsTag)
            .siblings('.levels-block')
            .css({display: result.appealsTag ? 'block' : 'none'})
    );

    chrome.storage.sync.get(
        'incidentsTag',
        result => $('input[name="incidents-tag"]')
            .prop('checked', result.incidentsTag)
            .siblings('.levels-block')
            .css({display: result.incidentsTag ? 'block' : 'none'})
    );

    chrome.storage.sync.get('appealNotifications', function (result) {
        const levels = result.appealNotifications || [];
        $.each(levels, function (i, state) {
            $('input[name^="appeal.notifications"]').eq(i).prop('checked', state);
            if (state) $('.tg-appeal-notification-settings').show();
        });
    });

    chrome.storage.sync.get('incidentNotifications', function (result) {
        const levels = result.incidentNotifications || [];
        $.each(levels, function (i, state) {
            $('input[name^="incident.notifications"]').eq(i).prop('checked', state);
            if (state) $('.tg-incident-notification-settings').show();
        });
    });

    chrome.storage.sync.get('appealNotReg', function (result) {
        const levels = result.appealNotReg || [];
        $.each(levels, function (i, state) {
            $('input[name^="appeal.not-reg"]').eq(i).prop('checked', state)
        });
    });

    chrome.storage.sync.get('incidentNotReg', function (result) {
        const levels = result.incidentNotReg || [];
        $.each(levels, function (i, state) {
            $('input[name^="incident.not-reg"]').eq(i).prop('checked', state)
        });
    });

    chrome.storage.sync.get('appealToWork', function (result) {
        const levels = result.appealToWork || [];
        $.each(levels, function (i, state) {
            $('input[name^="appeal.to-work"]').eq(i).prop('checked', state)
        });
    });

    chrome.storage.sync.get('incidentToWork', function (result) {
        const levels = result.incidentToWork || [];
        $.each(levels, function (i, state) {
            $('input[name^="incident.to-work"]').eq(i).prop('checked', state)
        });
    });

    chrome.storage.sync.get('tgAppealBotApiToken', function (result) {
        if (result.tgAppealBotApiToken) {
            $('#tg-appeal-bot-api_token').val(result.tgAppealBotApiToken);
            $('#tg-appeal-bot-api_token-btn').css({'background-color': 'green'});
        }
    });

    chrome.storage.sync.get('tgAppealChatId', function (result) {
        if (result.tgAppealChatId) {
            $('#tg-appeal-chat_id').val(result.tgAppealChatId);
            $('#tg-appeal-chat_id-btn').css({'background-color': 'green'});
        }
    });

    chrome.storage.sync.get('tgIncidentBotApiToken', function (result) {
        if (result.tgIncidentBotApiToken) {
            $('#tg-incident-bot-api_token').val(result.tgIncidentBotApiToken);
            $('#tg-incident-bot-api_token-btn').css({'background-color': 'green'});
        }
    });

    chrome.storage.sync.get('tgIncidentChatId', function (result) {
        if (result.tgIncidentChatId) {
            $('#tg-incident-chat_id').val(result.tgIncidentChatId);
            $('#tg-incident-chat_id-btn').css({'background-color': 'green'});
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