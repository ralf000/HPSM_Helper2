chrome.storage.local.get('autoReged', function (result) {
    var autoReged = result.autoReged;
    if (autoReged !== 'on') {
        
        function msgShower(msg){
            var hint = document.createElement('div');
            hint.id = 'hint';
            hint.style.position = 'fixed';
            hint.style.backgroundColor = '#003366';
            hint.style.fontSize = '14px';
            hint.style.padding = '5px';
            hint.style.textAlign = 'center';
            hint.style.color = 'white';
            hint.style.zIndex = 100;
            hint.style.bottom = 0;
            hint.style.width = '100%';
            hint.innerHTML = msg;
            form.appendChild(hint);
            setTimeout(function(){hint.style.display = 'none';}, 8000);
        }
        
        var form, input, msg;
        try {
            form = parent.frames[0].document.forms.topaz;
            if (!form)
                throw new Error('форма не была получена');
        } catch (e) {
            form = parent.frames[1].document.forms.topaz;
        }
        if (form) {
            input = form.elements;
            status = input['instance/hpc.status'].value;
            if (input['instance/resolution/resolution']) {
                if (input['instance/resolution/resolution'].value.indexOf('АвтоРегистрация') > -1) {
                    msg = 'Это обращение было зарегистрировано автоматически при помощи авторегистратора.<br>Вы можете перезаполнить его одним кликом, воспользовавшись HPSM Helper';
                    msgShower(msg);
                }
            }
            if (status === 'Зарегистрировано' && !input['instance/hpc.groupservice'].value) {
                msg = 'Это обращение заполнено не полностью.<br>Вы можете перезаполнить его одним кликом, воспользовавшись HPSM Helper<br>';
                msgShower(msg);
            }
        }
    }
});