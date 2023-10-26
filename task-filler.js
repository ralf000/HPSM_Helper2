// Глобальные переменные
var w = getActiveWindowByHPSM();
var form = getActiveFormByHPSM();
var status = getStatus();
// var num = w.find('span[ref="instance/incident.id"] span');

function getTitle() {
    return (form.find('input[name="instance/title"]').length > 0)
        ? form.find('input[name="instance/title"]')
        : form.find('input[name="instance/brief.description"]');
}

function getTaskData(callback) {
    getSavedParam('taskData', ({taskData}) => {
        if (taskData) {
            callback(taskData);
        } else {
            throw new Error('Неверный тип обращения/инцидента');
        }
    });
}

function fillTask(task) {
    if (status === 'Выполнено') {
        closeTask();
        return;
    }
    form.find('input[name="instance/category"]').val(task[1]);
    form.find('input[name="instance/hpc.direction"]').val(task[2]);
    form.find('input[name="instance/hpc.groupservice"]').val(task[3]);
    form.find('input[name="instance/hpc.groupservice"]').click();
    form.find('input[name="instance/affected.item"]').val(task[4]);
    form.find('input[name="instance/affected.item"]').click();
    form.find('input[name="instance/hpc.service"]').val(task[5]);
    form.find('input[name="instance/priority.code"]').val(task[6]);

    var title = getTitle();
    if (title.val().length === 0)
        title.val('Без темы');

    var resolution = form.find('textarea[name="instance/resolution/resolution"]');
    if (resolution.val().length === 0 || resolution.val().indexOf('АвтоРегистрация') !== -1){
        resolution.val(task[7]);
        resolution.next('.textareaView').find('p').text(task[7]);
    }

    form.find('input[name="instance/resolution.code"]').val(task[8]);
}

function closeTask() {
    swal({
            title: 'Закрыть?',
            text: '\nОбращение уже имеет статус ' + status,
            type: "warning",
            allowOutsideClick: true,
            showCancelButton: true,
            confirmButtonColor: "#FF8100",
            confirmButtonText: "Закрыть",
            cancelButtonText: "Не нужно"
        },
        function (isConfirm) {
            if (!isConfirm)
                w.find('button:contains("ОК")').click();
        });
}

//запуск
getTaskData(fillTask);
