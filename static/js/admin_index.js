function add_code_group(group_fields, group_num, is_base_code=false) {
    group_fields.attr("id", group_fields.attr("id").replace(/temp/g, group_num));
    group_fields.children("div").each(function() {
        $(this).attr("id", $(this).attr("id").replace(/temp/g, group_num));
        $(this).children().each(function() {
            $(this).attr("id", $(this).attr("id").replace(/temp/g, group_num));
        });
    });
    if (is_base_code) {
        let gfc = group_fields.children("div").first();
        gfc.attr("id", "b" + gfc.attr("id"));
    }
    group_fields.children("div").first().children().each(function() {
        if (is_base_code) {
            $(this).attr("name", "b" + $(this).attr("name").replace(/temp/g, group_num));
            if ($(this).hasClass('g_index')) {
                $(this).attr("class", "b_" + $(this).attr("class"));
            }
            if ($(this).hasClass('del_group')) {
                $(this).addClass('base_group')
            }
        }
        else {
            $(this).attr("name", $(this).attr("name").replace(/temp/g, group_num));
        }
    });
    group_fields.children(".add_code").attr("id", group_fields.children(".add_code").attr("id").replace(/temp/g, group_num));
    group_fields.children(".add_code").attr("group_idx", group_num);
    if (is_base_code) {
        group_fields.children(".add_code").addClass("base_group")
    }
    return group_fields;
}

function clone_code_fields(code_fields, code_num) {
    code_fields.attr("id", code_fields.attr("id").replace(/temp/g, code_num));
    // code_fields.children("div").attr("id", code_fields.children("div").attr("id").replace(/temp/g, code_num));
    code_fields.children().each(function() {
        $(this).attr("id", $(this).attr("id").replace(/temp/g, code_num));
        $(this).attr("name", $(this).attr("name").replace(/temp/g, code_num));
    });
    code_field = code_fields.children().first();
    return code_fields
}

function get_next_group_index(is_base_codes=false) {
    let g_index = 0;
    if (is_base_codes) {
        $(".b_g_index").each(function(){
            if ($(this).val() > g_index) g_index = $(this).val();
        });
    }
    else {
        $(".g_index").each(function(){
            if ($(this).val() > g_index) g_index = $(this).val();
        });
    }
    return Number(g_index) + 1;
}

$(".add_group").click(function() {
    var group_fields = $("#new_group-temp-container").clone();
    var group_num = $("#group_num").val();
    if ($(this).hasClass("base_group")) {
        group_fields = add_code_group(group_fields, group_num, is_base_code=true);
        $(this).before(group_fields);
        let g_index = get_next_group_index(is_base_codes=true);
        group_fields.find('.b_g_index').val(g_index);
    }
    else {
        group_fields = add_code_group(group_fields, group_num);
        $(this).before(group_fields);
        let g_index = get_next_group_index();
        group_fields.find('.g_index').val(g_index);
    }
    group_fields.find("input:nth-child(2)").focus();
    $(".add_code").off("click").on("click", function() {
        add_code_fields($(this));
    });

    $(".del_group").off("click").on("click", function() {
        if ($(this).hasClass("new") ) {
            delete_code_or_group($(this));
        }
        else {
            confirm_delete($(this), "Delete code group and all codes it contains?");
        }
    });

    // var add_code_btn = $("#ng_add_code_btn-temp").clone();
    // add_code_btn.attr("id", add_code_btn.attr("id").replace(/temp/g, group_num));
    // $(this).before(add_code_btn);
    $("#group_num").val(Number(group_num) + 1);
    $("#group_num").trigger("change");
    toogle_save_btn_on_change();
});

$(".add_code").off("click").on("click", function() {
    add_code_fields($(this));
    $(".code-code.base_group").off("change").on("change", function() {
        $("#save_class_btn").prop("disabled", false);
        update_reference_codes($(this));
    });
    toogle_save_btn_on_change()
});

function add_code_fields(add_btn) {
    var code_fields = $("#new_code-temp").clone();
    var code_num = $("#code_num").val();
    code_fields = clone_code_fields(code_fields, code_num);
    code_fields.children().first().attr("group_idx", add_btn.attr("group_idx"));
    code_fields.children().first().attr("gfc_id", add_btn.parent().children().first().attr("id"));
    code_fields.append(`<input name="new_code-group-${code_num}" type="hidden" value="${add_btn.parent().children().first().attr("id")}" />`)
    if (add_btn.hasClass("base_group")) {
        code_fields.children().first().addClass("base_group")
    }
    if (add_btn.attr("id").substring(0,2) == "ng" ) {
        code_fields.children().first().addClass("new_group");
    }
    
    add_btn.prev().css("display", "block");
    add_btn.prev().append(code_fields);
    code_fields.children().first().focus();
    $(".del_code").off("click").on("click", function() {
        if ($(this).hasClass("new") ) {
            delete_code_or_group($(this));
        }
        else {
            confirm_delete($(this));
        }
    });
    $("#code_num").val(Number(code_num) + 1);
}

$(".del_group").off("click").on("click", function() {
    if ($(this).hasClass("new") ) {
        delete_code_or_group($(this));
    }
    else {
        confirm_delete($(this), "Delete code group and all codes it contains?");
    }
});
$(".del_code").off("click").on("click", function() {
    if ($(this).hasClass("new") ) {
        delete_code_or_group($(this));
    }
    else {
        confirm_delete($(this));
    }
});

$(".code-code.base_group").off("change").on("change", function() {
    $("#save_class_btn").prop("disabled", false);
    update_reference_codes($(this));
});

function delete_code_or_group(del_btn) {
    is_base_codes = false;
    if (del_btn.hasClass('base_group')) {
        is_base_codes = true
    }
    if (! del_btn.hasClass("new")) {
        if (del_btn.hasClass("del_group")) {
            let btn_id = del_btn.attr("id");
            let groups_cont = del_btn.parent().parent().parent();
            groups_cont.append(`<input type='hidden' name='${btn_id}' value="delete" />`);
        }
        else if (del_btn.hasClass("del_code")) {
            let btn_id = del_btn.attr("id");
            let codes_cont = del_btn.parent().parent();
            codes_cont.append(`<input type='hidden' name='${btn_id}' value="delete" />`);
        }
    } 
    if (del_btn.hasClass("del_group")) {
        gfc_id = del_btn.parent().attr("id");
        $(`select[group_id=${gfc_id}]`).each(function() {
            if ($(this).parent().children("select").length == 1) {
                $(this).parent().remove();
            }
            $(this).remove();
        })
        del_btn.parent().parent().remove();
    }
    else {
        if (del_btn.parent().parent().children(".code_fields").length === 1) {
            del_btn.parent().parent().css("display", "none");
        }
        let code_field = del_btn.parent().children().first();
        code_field.val("");
        code_field.trigger("change");
        del_btn.parent().remove();
    }
    del_btn.parent().parent().remove();
    toogle_save_btn_on_change();
}

function confirm_delete(del_btn, content="Proceed to delete?") {
    $.confirm({
        title: 'Confirm Delete!',
        content: content,
        buttons: {
            yes: {
                btnClass: 'del_btn',
                action: function () {
                    delete_code_or_group(del_btn)
                },
            },
            cancel: {
                action: function() {

                },
            }
        },
        columnClass: 'confirm_modal',
    });
};

$("#delete_class_btn").on("click", function() {
    $.confirm({
        title: 'Confirm Delete!',
        content: 'Delete Constuction Class and all its codes?',
        buttons: {
            yes: {
                btnClass: 'del_btn',
                action: function () {
                    $("#delete_class_btn").parent().append("<input type='hidden' name='cons_class-delete'  value='delete'/>");
                    $("#save_class_btn").prop("disabled", false);
                    $("#save_class_btn").click();
                },
            },
            cancel: {
                action: function() {

                },
            }
        },
        columnClass: 'confirm_modal',
    });
});

document.getElementById("cons_class-name").onkeyup = function(event) {
    if (event.target.value.trim() != "") {
        $("#save_class_btn").prop("disabled", false);
    }
    else {
        $("#save_class_btn").prop("disabled", true);
    }
}

// $(".g_name").on("change", function() {
//     if ($(this).val() != "") {
//         $(this).parent().next().next().prop("disabled", false);
//     }
// });

function update_group_indices(is_base_codes=false) {
    indx = 1;
    group_index_class = ".g_index"
    if (is_base_codes) group_index_class = ".b_g_index"
    $(group_index_class).each(function(){
        $(this).val(indx);
        indx++;
    })
}

function add_code_references(man_num, new_ref=true) {
    if (man_num == null) {
        man_num = $("#man_num").val();
        man_num++;
    }
    let container_id = `code_reference-${man_num}`;
    if (new_ref) container_id = "new_" + container_id;
    $(".b_g_index").each(function() {
        if ($(this).next().val() != "") {
            let group_index = $(this).val();
            let sel = $("#man_temp select").clone();
            sel.attr("id", sel.attr("id").replace(/temp/g, `${man_num}-${group_index}`));
            sel.attr("name", sel.attr("name").replace(/temp/g, `${man_num}-${group_index}`));
            if (new_ref) {
                sel.attr("id", "new_" + sel.attr("id"));
                sel.attr("name","new_" + sel.attr("name"));
            }
            sel.attr("group_id", $(this).parent().attr("id"));
            $("#man_num").val(man_num);
            add_code_options($(this), sel);
            if (sel.children("option").length > 1) {
                if ($(`#${container_id}`).length) {
                    $(`#${container_id}`).append(sel);
                }
                else {
                    $("#code_reference_fields").append(`<div id="${container_id}" class="code_reference" man_num="${man_num}"></div>`);
                    $(`#${container_id}`).append(sel);
                }
                toogle_save_btn_on_change()
            }
        }
    });
    if ($(`#${container_id}`).length) {
        let page_field = $("#ref_code-ref-temp").clone();
        page_field.attr("id", page_field.attr("id").replace(/temp/g, man_num));
        page_field.attr("name", page_field.attr("name").replace(/temp/g, man_num));
        if (new_ref) {
            page_field.attr("id", "new_" + page_field.attr("id"));
            page_field.attr("name", "new_" + page_field.attr("name"));
        }
        $(`#${container_id}`).append(page_field);
        let del_btn = $("#ref_code-delete-temp").clone();
        del_btn.attr("id", del_btn.attr("id").replace(/temp/g, man_num));
        del_btn.attr("name", del_btn.attr("name").replace(/temp/g, man_num));
        if (new_ref) {
            del_btn.attr("id", "new_" + del_btn.attr("id"));
            del_btn.attr("name", "new_" + del_btn.attr("name"));
            del_btn.addClass("new");
        }
        else {
            del_btn.html("&#x1f5d1;");
        }
        $(`#${container_id}`).append(del_btn);
        del_btn.on("click", function(){
            delete_code_reference($(this));
        })
        $("#code_reference_fields").css("display", "block");
        toogle_save_btn_on_change();
    }
    
}

function delete_code_reference(del_btn) {
    if (! del_btn.hasClass("new")) {
        $.confirm({
            title: 'Confirm Delete!',
            content: "Delete code reference?",
            buttons: {
                yes: {
                    btnClass: 'del_btn',
                    action: function () {
                        $("#code_reference_fields").append(`<input type='hidden' name='${del_btn.attr("id")}' value="delete" />`);
                        del_btn.parent().remove();
                    },
                },
                cancel: {
                    action: function() {
    
                    },
                }
            },
            columnClass: 'confirm_modal',
        });
    }
    else {
        del_btn.parent().remove();
    }
}

$("#add_manual_reference").on("click", function() {
    add_code_references(null);
    $(this).prev().children().last().children().first().focus();
});

function add_code_options(el, sel) {
    el.parent().next().find("[id*='code-code']").each(function () {
        if ($(this).val() != "") {
            sel.append(`<option value="${$(this).attr('name')}">${$(this).val()}</option>`);
        }
    });
}

function update_reference_codes(el) {
    let gfc_id = el.attr("gfc_id");
    bg_index_el = $(`#${gfc_id}`).children().first();
    let group_index = bg_index_el.val();
    let sel_els = $(`[id^="ref_code-code"][id$="-${group_index}"]`);
    if (sel_els.length) {
        sel_els.each(function() {
            let sel_idx = $(this).val();
            $(this).children("option[id!=empty]").remove();
            add_code_options(bg_index_el, $(this));
            if ($(this).children().length == 1) {
                if ($(this).parent().children("select").length == 1) {
                    $(this).parent().remove();
                }
                $(this).remove();
            }
            else {
                $(this).val(sel_idx);
            }
        });
    }
    else {
        $(".code_reference").each(function() {
            let man_num = $(this).attr("man_num");
            let sel = $("#man_temp select").clone();
            sel.attr("id", sel.attr("id").replace(/temp/g, `${man_num}-${group_index}`));
            sel.attr("name", sel.attr("name").replace(/temp/g, `${man_num}-${group_index}`));
            sel.attr("group_id", bg_index_el.parent().attr("id"));
            add_code_options(bg_index_el, sel);
            let added = false;
            $(this).children("select").each(function() {
                if (Number($(this).attr("group_index") - 1 == Number(group_index)) ) {
                    $(this).before(sel);
                    added = true
                }
            })
            if (! added ) $(this).children().last().prev().before(sel);
        });
    }
    
}

$(document).ready(function() {
    $(".code_container").each(function() {
        if ($(this).children().length) {
            $(this).css("display", "block");
        }
    });
    class_id = $("#cons_class-id").val();
    if (class_id) {
        $.ajax({
            url: '/ajax/load-base-code-references',
            type: 'get',
            dataType: 'json',
            data: {
                'class-id': class_id,
            },
            beforeSend: function() {
                $("#loader").css("display", "block");
            },
            success: function(data) {
                for (itm in data) {
                    add_code_references(itm, new_ref=false);
                    for (let index = 0; index < data[itm]['subcode'].length; index++) {
                        // let el = $(`#code_reference-${itm}`).children(`select:nth-child(${index+1})`);
                        $(`#code_reference-${itm}`).children(`select:nth-child(${index+1})`).val(`code-code-${data[itm]['subcode'][index]}`);
                    }
                    $(`#code_reference-${itm}`).children('input').val(data[itm]['page']);
                }
                $("#loader").css("display", "none");
            }
        });
    }
});

$("#save_class_btn").on("click", function() {
    // $(".b_g_index").prop("disabled", false);
    // $(".g_index").prop("disabled", false);
    $("[id*='-temp']").prop("disabled", true);
});

$("#class_names-header").click(function(){
    if ($("#class_names-content").hasClass("collapsed")) {
        $("#coll_icon").html("\u25BD");
        $("#class_names-content").removeClass("collapsed");
        $("#class_names-content").css("display", "block");
    }
    else {
        $("#coll_icon").html("\u25B6");
        $("#class_names-content").addClass("collapsed");
        $("#class_names-content").css("display", "none");
    }
});

$(".class_names input").change(function(){
    $("#save_class_btn").prop("disabled", false);
})

$("#add_class_name").click(function() {
    let class_name_div = $("#new_class_name-temp").clone();
    let class_name_num = $("#name_num").val();
    class_name_div.attr("id", class_name_div.attr("id").replace(/temp/g, class_name_num));
    class_name_div.children().each(function(){
        $(this).attr("id", $(this).attr("id").replace(/temp/g, class_name_num));
        $(this).attr("name", $(this).attr("name").replace(/temp/g, class_name_num));
    });
    $(this).before(class_name_div);
    class_name_num++;
    $("#name_num").val(class_name_num);
    toogle_save_btn_on_change();
});

function update_row_column_indices() {
    prev_el_parent = $('#code-form');
    row_index = -1;
    col_index = 0;
    $("input:not(:disabled):visible[type!='hidden'], select").each(function() {
        if ($(this).parent().attr("id") == prev_el_parent.attr("id")) {
            col_index++;
        }
        else {
            col_index = 0;
            row_index++;
        }
        $(this).attr("r_idx", row_index);
        $(this).attr("c_idx", col_index);
        prev_el_parent = $(this).parent();
        $("#r_idx_max").val(row_index);
        // toogle_save_btn_on_change();
        // nav_keys_binding($(this));
    });
}

function toogle_save_btn_on_change() {
    $("input:not(:disabled):visible[type!='hidden'], select").each(function() {
        if (! $(this).hasClass("code-code") ) {
            $(this).off('change').on("change", function() {
                $("#save_class_btn").prop("disabled", false);
            });
        }
    });
}

function nav_keys_binding(el){
    el.off('keyup').on('keyup', function(event) {
        if (event.which == 37) {
            if (el.attr("c_idx") > 0) {
                el.prev().focus();
            }
        }
        else if (event.which == 38) {
            r_idx = el.attr("r_idx");
            if (r_idx > 0) {
                $(`[r_idx=${r_idx-1}]`).focus();
            }
        }
        else if (event.which == 39) {
            max_col_idx = el.parent("input:not(:disabled):visible[type!='hidden'], select").length - 1;
            if (el.attr("c_idx") < max_col_idx) {
                el.next("input:not(:disabled):visible[type!='hidden'], select").focus();
            }
        }
        else if (event.which == 40) {
            max_row_idx = $("#r_idx_max").val();
            r_idx = el.attr("r_idx");
            if (r_idx < max_row_idx) {
                $(`[r_idx=${r_idx+1}]`).focus();
            }
        }
    });
};