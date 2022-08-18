function setSavedParam(data) {
    chrome.storage.sync.set(data);
}

function getSavedParam(name, callback) {
    chrome.storage.sync.get(name, callback);
}

function removeSavedParam(name) {
    chrome.storage.sync.remove(name);
}

function addHandlers() {
    $('#autoReg').on('click', function () {
        removeSavedParam('todo');
        if ($(this).prop('checked')) {
            setSavedParam({registration: 'on'});
            setSavedParam({initRegistration: 'on'});
            chrome.tabs.executeScript(null, {file: 'autoreg.js'});
            setTimeout(function () {
                window.close();
            }, 500);
        } else {
            setSavedParam({registration: 'off'});
        }
    });

    $('a[data-target]').click(function (e) {
        e.preventDefault();
        $($(this).data('target')).slideToggle();
    });

    $('#save-hpsm-login').on('click', function (e) {
        e.preventDefault();
        var login = $('#login-hpsm-input').val();
        setSavedParam({loginHPSM: login});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-password').on('click', function (e) {
        e.preventDefault();
        var password = $('#password-hpsm-input').val();
        setSavedParam({passwordHPSM: password});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-new-login').on('click', function (e) {
        e.preventDefault();
        var login = $('#login-hpsm-new-input').val();
        if (!login.length) return;
        setSavedParam({loginNewHPSM: login});
        $(this).css({'background-color': 'green'})
    });

    $('#save-hpsm-new-password').on('click', function (e) {
        e.preventDefault();
        var password = $('#password-hpsm-new-input').val();
        if (!password.length) return;
        setSavedParam({passwordNewHPSM: password});
        $(this).css({'background-color': 'green'})
    });

    $('#save-time').on('click', function (e) {
        e.preventDefault();
        var time = $('#time-input').val();
        setSavedParam({updateTasksTime: time});
        $(this).css({'background-color': 'green'})
    });

    $('.levels-trigger').click(e => $(e.target).siblings('.levels-block').slideToggle());

    $('input[name="appeals-tag"]').on('click', function () {
        const state = $(this).is(':checked');
        setSavedParam({appealsTag: state});
    });

    $('input[name="incidents-tag"]').on('click', function () {
        const state = $(this).is(':checked');
        setSavedParam({incidentsTag: state});
    });

    $('input[name^="appeal.notifications"]').on('click', function () {
        const states = $('input[name^="appeal.notifications"]').map((i, el) => $(el).is(':checked')).toArray();
        const checked = states.reduce((prev, current) => prev || current);
        const tgSettings = $('.tg-appeal-notification-settings');
        checked ? tgSettings.slideDown() : tgSettings.slideUp();
        setSavedParam({appealNotifications: states});
    });

    $('input[name^="incident.notifications"]').on('click', function () {
        const states = $('input[name^="incident.notifications"]').map((i, el) => $(el).is(':checked')).toArray();
        const checked = states.reduce((prev, current) => prev || current);
        const tgSettings = $('.tg-incident-notification-settings');
        checked ? tgSettings.slideDown() : tgSettings.slideUp();
        setSavedParam({incidentNotifications: states});
    });

    $('input[name^="appeal.not-reg"]').on('click', function () {
        const states = $('input[name^="appeal.not-reg"]').map((i, el) => $(el).is(':checked'));
        setSavedParam({appealNotReg: states});
    });

    $('input[name^="incident.not-reg"]').on('click', function () {
        const states = $('input[name^="incident.not-reg"]').map((i, el) => $(el).is(':checked'));
        setSavedParam({incidentNotReg: states});
    });

    $('#tg-appeal-bot-api_token-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-appeal-bot-api_token').val();
        setSavedParam({tgAppealBotApiToken: value});
        $(this).css({'background-color': 'green'})
    });

    $('#tg-appeal-chat_id-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-appeal-chat_id').val();
        setSavedParam({tgAppealChatId: value});
        $(this).css({'background-color': 'green'})
    });

    $('#tg-incident-bot-api_token-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-incident-bot-api_token').val();
        setSavedParam({tgIncidentBotApiToken: value});
        $(this).css({'background-color': 'green'})
    });

    $('#tg-incident-chat_id-btn').on('click', function (e) {
        e.preventDefault();
        const value = $('#tg-incident-chat_id').val();
        setSavedParam({tgIncidentChatId: value});
        $(this).css({'background-color': 'green'})
    });
}

function setAutoRegStatus() {
    getSavedParam('registration', function (result) {
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
                setSavedParam({taskData: data[id]});
                chrome.tabs.executeScript(null, {file: 'task-filler.js'});
            });
        }
    }
}

function saveCurrentTab() {
    return new Promise(resolve => {
        chrome.tabs.getSelected(null, function (tab) {
            if (tab.url
                && (tab.url.indexOf('sm.mos') === -1
                    && tab.url.indexOf('sm.eaist.mos') === -1
                    && tab.url.indexOf('sm.tender.mos') === -1
                    && tab.url.indexOf('212.11.152.7') === -1)
            ) {
                return false;
            }

            setSavedParam({tab: tab.id});

            /*getSavedParam('registration', function (result) {
                var registration = result.registration;
                if (registration !== 'on') {
                    tab = tab.id;
                }
            });*/

            return resolve();
        });
    });
}


function fillFields() {
    getSavedParam('loginHPSM', function (result) {
        if (result.loginHPSM) {
            $('#login-hpsm-input').val(result.loginHPSM);
            $('#save-hpsm-login').css({'background-color': 'green'});
        }
    });

    getSavedParam('passwordHPSM', function (result) {
        if (result.passwordHPSM) {
            $('#password-hpsm-input').val(result.passwordHPSM);
            $('#save-hpsm-password').css({'background-color': 'green'});
        }
    });

    getSavedParam('passwordNewHPSM', function (result) {
        if (result.passwordNewHPSM) {
            $('#password-hpsm-new-input').val(result.passwordNewHPSM);
            $('#save-hpsm-new-password').css({'background-color': 'green'});
        }
    });

    getSavedParam('loginNewHPSM', function (result) {
        if (result.loginNewHPSM) {
            $('#login-hpsm-new-input').val(result.loginNewHPSM);
            $('#save-hpsm-new-login').css({'background-color': 'green'});
        }
    });

    getSavedParam('updateTasksTime', function (result) {
        if (result.updateTasksTime) {
            $('#time-input').val(result.updateTasksTime);
            $('#save-time').css({'background-color': 'green'});
        }
    });


    getSavedParam('appealsTag', result => $('input[name="appeals-tag"]')
        .prop('checked', result.appealsTag)
        .siblings('.levels-block')
        .css({display: result.appealsTag ? 'block' : 'none'})
    );


    getSavedParam('incidentsTag', function (result) {
        $('input[name="incidents-tag"]')
            .prop('checked', result.incidentsTag)
            .siblings('.levels-block')
            .css({display: result.incidentsTag ? 'block' : 'none'});
    });

    getSavedParam('appealNotifications', function (result) {
        const levels = result.appealNotifications || [];
        $.each(levels, function (i, state) {
            $('input[name^="appeal.notifications"]').eq(i).prop('checked', state);
            if (state) $('.tg-appeal-notification-settings').show();
        });
    });

    getSavedParam('incidentNotifications', function (result) {
        const levels = result.incidentNotifications || [];
        $.each(levels, function (i, state) {
            $('input[name^="incident.notifications"]').eq(i).prop('checked', state);
            if (state) $('.tg-incident-notification-settings').show();
        });
    });

    getSavedParam('appealNotReg', function (result) {
        const levels = result.appealNotReg || [];
        $.each(levels, function (i, state) {
            $('input[name^="appeal.not-reg"]').eq(i).prop('checked', state)
        });
    });

    getSavedParam('incidentNotReg', function (result) {
        const levels = result.incidentNotReg || [];
        $.each(levels, function (i, state) {
            $('input[name^="incident.not-reg"]').eq(i).prop('checked', state)
        });
    });

    getSavedParam('tgAppealBotApiToken', function (result) {
        if (result.tgAppealBotApiToken) {
            $('#tg-appeal-bot-api_token').val(result.tgAppealBotApiToken);
            $('#tg-appeal-bot-api_token-btn').css({'background-color': 'green'});
        }
    });

    getSavedParam('tgAppealChatId', function (result) {
        if (result.tgAppealChatId) {
            $('#tg-appeal-chat_id').val(result.tgAppealChatId);
            $('#tg-appeal-chat_id-btn').css({'background-color': 'green'});
        }
    });

    getSavedParam('tgIncidentBotApiToken', function (result) {
        if (result.tgIncidentBotApiToken) {
            $('#tg-incident-bot-api_token').val(result.tgIncidentBotApiToken);
            $('#tg-incident-bot-api_token-btn').css({'background-color': 'green'});
        }
    });

    getSavedParam('tgIncidentChatId', function (result) {
        if (result.tgIncidentChatId) {
            $('#tg-incident-chat_id').val(result.tgIncidentChatId);
            $('#tg-incident-chat_id-btn').css({'background-color': 'green'});
        }
    });
}

async function init() {
    $.getJSON('data.json', appendBtns);
    await saveCurrentTab();
    addHandlers();
    setAutoRegStatus();
    fillFields();
}


$(function () {
    init();
});