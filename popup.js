function addHandlers() {
    $('#autoReg').on('click', function () {
        chrome.storage.sync.remove('todo');
        if ($(this).prop('checked')) {
            chrome.storage.sync.set({registration: 'on'});
            chrome.tabs.executeScript(null, {file: 'autoreg.js'});
            setTimeout(function () {
                window.close();
            }, 1000);
        } else {
            chrome.storage.sync.set({registration: 'off'});
        }
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
        if (tab.url.indexOf('sm.mos') === -1)
            return false;
        tab = tab.id;
        chrome.storage.sync.set({hpsmTab: tab});
    });
}


function init() {
    $.getJSON('data.json', appendBtns);
    addHandlers();
    setAutoRegStatus();
    saveCurrentTab();
}


$(function () {
    init();
});