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
 * Страница с кнопкой "Продолжить"
 * @returns bool
 */
function isContinuePage() {
    return $('#btnContinue').length;
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
        callback(hpsmTab);
    });
}

function getTopLayer() {
    return '<div id="toplayer" style="\
                position: fixed;\
                top: 0;\
                right: 0;\
                left: 0;\
                bottom: 0;\
                z-index: 999;\
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
                        <img src="http://utilites.2hut.ru/loading.gif" alt="">\
                        Авторегистрация\
                        </span>\
                    </div>';
}

function clean() {
    chrome.storage.sync.remove('registration');
    chrome.storage.sync.remove('todo');
    chrome.storage.sync.remove('hpsmTab');
}

function getAutoRegStatus(callback) {
    chrome.storage.sync.get('registration', function (result) {
        var registration = result.registration;
        callback(registration);
    });
}