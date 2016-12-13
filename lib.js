/**
 * переводит первый символ в верхний регистр
 * @param string
 * @returns {string}
 */
function ucFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
    return id[id.length-1];
}

/**
 * Возвращает активную область
 * @returns object jquery active area
 */
function getActiveWindowByHPSM() {
    var tabId = getActiveTabIdByHPSM();
    return (tabId && tabId.length > 0) ? $('.x-tab-panel-bwrap').find('#'+tabId) : $('.x-tab-panel-bwrap');
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
    chrome.storage.local.get('hpsmTab', function (result) {
        var hpsmTab = result.hpsmTab;
        callback(hpsmTab);
    });
}

function getTopLayer() {
    return '<div id="toplayer" style="\
                display: none;\
                background-color: black;\
                opacity: 0.8;\
                width: 100%;\
                height: 100vh;\
                z-index: 999;\
                position: absolute;">\
                <span style="\
                    display: block;\
                    color: white;\
                    position: relative;\
                    top: 45%;\
                    left: 45%;">\
                    Авторегистрация\
                    <div id="working" style="width: 100px;font-size: 12px;margin-top: 10px;">\
                        <img src="http://investmoscow.ru/media/3064469/progressbar.gif" alt="" \
                            style="left: 20px;top: 10px;position: relative;">\
                    </div>\
                </span>\
            </div>';
}

function clean() {
    chrome.storage.local.remove('registration');
    chrome.storage.local.remove('todo');
    chrome.storage.local.remove('hpsmTab');
}

function getAutoRegStatus(callback) {
    chrome.storage.local.get('registration', function (result) {
        var registration = result.registration;
        callback(registration);
    });
}