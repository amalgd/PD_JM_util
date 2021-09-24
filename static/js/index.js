var code_references = {}

function add_schedule_fields(btn){
    if (btn.attr("id") == "add_station") {
        let stn_rows = $("#station_temp tr").clone();
        let stn_num = $("#station_num").val();
        let sched_num = $("#sched_num").val();
        stn_num++;
        sched_num++;
        stn_rows.attr("id", stn_rows.attr("id").replace(/temp1/g, `${sched_num}`));
        stn_rows.children().each(function() {
            $(this).attr("id", $(this).attr("id").replace(/temp/g, `${sched_num}-${stn_num}`));
            $(this).children().each(function(){
                $(this).attr("id", $(this).attr("id").replace(/temp/g, `${sched_num}-${stn_num}`));
                $(this).attr("name", $(this).attr("name").replace(/temp/g, `${sched_num}-${stn_num}`));
            });
        });
        $("#sched_temp tr").children().each(function(){
            stn_rows.append($(this).clone());
        })
        stn_rows.children().each(function() {
            $(this).attr("id", $(this).attr("id").replace(/temp/g, `${sched_num}`));
            $(this).children().each(function(){
                $(this).attr("id", $(this).attr("id").replace(/temp/g, `${sched_num}`));
                $(this).attr("name", $(this).attr("name").replace(/temp/g, `${sched_num}`));
            });
        });
        stn_rows.find("[id^='new_stn-num']").first().val(stn_num);
        btn.parent().parent().before(stn_rows);
        stn_rows.children().eq(1).children().first().focus();
        let add_sched_btn_row = $("#new_add_sched-temp").parent().parent().clone();
        let add_sched_btn = add_sched_btn_row.find("button").first();
        add_sched_btn.attr("id", `new_add_sched-${stn_num}`);
        add_sched_btn.attr("stn_row_id", stn_rows.attr("id"));
        add_sched_btn.text(`Add another schedule to station ${stn_num}`);
        add_sched_btn.click(function(){
            add_schedule_fields($(this));
        });
        btn.parent().parent().before(add_sched_btn_row);
        $("#station_num").val(stn_num);
        $("#sched_num").val(sched_num);
    }
    else {
        let sched_num = $("#sched_num").val();
        sched_num++;
        let stn_row_id = `#${btn.attr("stn_row_id")}`;
        let curr_rows = btn.parents('tr').prevUntil(stn_row_id, 'tr').length;
        $(stn_row_id).children(".station_fields").attr("rowspan", curr_rows + 3);
        let sched_rows = $("#sched_temp tr").clone();
        sched_rows.attr("id", sched_rows.attr("id").replace(/temp2/g, `${sched_num}`));
        sched_rows.children().each(function() {
            $(this).attr("id", $(this).attr("id").replace(/temp/g, `${sched_num}`));
            $(this).children().each(function(){
                $(this).attr("id", $(this).attr("id").replace(/temp/g, `${sched_num}`));
                $(this).attr("name", $(this).attr("name").replace(/temp/g, `${sched_num}`));
            });
        });
        btn.parent().parent().before(sched_rows);
        sched_rows.children().first().children().first().focus();
        $("#sched_num").val(sched_num);
    }
    $(".code").off('click').on('click', function() {
        load_man_pages($(this));
    });
    $(".cons_class").off('change').on('change', function() {
        validate_cons_class.call(this);
        clear_codes_ref($(this));
    });
}

$("#add_station").click(function(){
    add_schedule_fields($(this));
});

function load_man_pages(code_btn) {
    let class_id = code_btn.parent().prev().children().first().val();
    if (!class_id) return false;
    $.confirm({
        title: 'Construction Code',
        content: '<div id="loader"></div>',
        onContentReady: function(){
            let self = this;
            if (!(class_id in code_references)) {
                $.ajax({
                    url: '/ajax/load-man-page-codes/',
                    type: 'get',
                    dataType: 'json',
                    data: {
                        'class-id': class_id,
                    },
                    success: function(data) {
                        let map = {};
                        let codes2ref = {};
                        // codes_at_indices = {};
                        for (ref_id in data['ref_dict']) {
                            let codes = "";
                            for (idx1 in data['ref_dict'][ref_id]['codes']) {
                                // if (!(idx1 in codes_at_indices)) {
                                //     codes_at_indices[idx1] = {};
                                // }
                                // if (!(data['ref_dict'][ref_id]['codes'][idx1]['id'] in codes_at_indices[idx1])) {
                                //     codes_at_indices[idx1][data['ref_dict'][ref_id]['codes'][idx1]['id']] = {}
                                // }
                                // codes_at_indices[idx1][data['ref_dict'][ref_id]['codes'][idx1]['id']] = {
                                //                              'code': data['ref_dict'][ref_id]['codes'][idx1]['code'],
                                //                              'prefix': data['ref_dict'][ref_id]['codes'][idx1]['prefix'],
                                //                              'desc': data['ref_dict'][ref_id]['codes'][idx1]['desc'],
                                //                              'group': data['ref_dict'][ref_id]['codes'][idx1]['group']};
                                codes += data['ref_dict'][ref_id]['codes'][idx1]['id'].toString() + '-';
                                if (!(idx1 in map)) {
                                    map[idx1] = {};
                                }
                                if (!(data['ref_dict'][ref_id]['codes'][idx1]['id'] in map[idx1])) {
                                    map[idx1][data['ref_dict'][ref_id]['codes'][idx1]['id']] = {};
                                }
                                for (idx2 in data['ref_dict'][ref_id]['codes']) {
                                    if (idx1 != idx2) {
                                        if (!(idx2 in map[idx1][data['ref_dict'][ref_id]['codes'][idx1]['id']])) {
                                            map[idx1][data['ref_dict'][ref_id]['codes'][idx1]['id']][idx2] = []
                                        }
                                        map[idx1][data['ref_dict'][ref_id]['codes'][idx1]['id']][idx2].push(data['ref_dict'][ref_id]['codes'][idx2]['id']);
                                    }
                                }
                            }
                            codes2ref[codes] = {'ref_id': ref_id, 'man_page': data['ref_dict'][ref_id]['page']};
                        }
                        code_references[class_id] = {};
                        code_references[class_id]['base_codes'] = data['base_codes'];
                        code_references[class_id]['other_codes'] = data['other_codes'];
                        code_references[class_id]['map'] = map;
                        code_references[class_id]['codes2ref'] = codes2ref;
                        self.setContent(make_code_options_from_data());
                        self.$content.find(".code_part").change(function(){
                            set_lables($(this));
                        });
                        self.$content.find(".code_part").change();
                    }
                });
            }
            else {
                self.setContent(make_code_options_from_data());
                if (code_btn.is('[code_ids]')) {
                    let code_ids = code_btn.attr('code_ids');
                    let base_other = code_ids.split(':');
                    let bcode_ids = base_other[0].split('-');
                    let idx_bcode = {}
                    for (id in bcode_ids) {
                        if (bcode_ids[id].length) {
                            let id_split = bcode_ids[id].split('_');
                            idx_bcode[id_split[0]] = id_split[1];
                        }
                    }
                    let ocode_ids = base_other[1].split('-');
                    let idx_ocode = {}
                    for (id in ocode_ids) {
                        if (ocode_ids[id].length) {
                            let id_split = ocode_ids[id].split('_');
                            idx_ocode[id_split[0]] = id_split[1];
                        }
                    }
                    self.$content.find('.code_part').each(function() {
                        if ($(this).hasClass("base_code")) {
                            $(this).val(idx_bcode[$(this).attr("idx")]);
                        }
                        else {
                            $(this).val(idx_ocode[$(this).attr("idx")]);
                        }
                    });
                }
            }
            self.$content.find(".code_part").change(function(){
                set_lables($(this));
            });
            self.$content.find(".code_part").change();
        },
        buttons: {
            OK: {
                btnClass: 'ok_btn',
                action: function () {
                    select_code = ""
                    base_code_ids = "";
                    other_code_ids = "";
                    this.$content.find('.code_part').each(function() {
                        let idx = $(this).attr("idx");
                        if ($(this).hasClass("base_code")) {
                            let prefix = code_references[class_id]['base_codes'][idx][$(this).val()]['prefix'];
                            select_code += prefix + $(this).children(":selected").text();
                            base_code_ids += idx + '_' +  $(this).val() + '-';
                        }
                        else {
                            if ($(this).val() != "" ) {
                                let prefix = code_references[class_id]['other_codes'][idx][$(this).val()]['prefix'];
                                select_code += prefix + $(this).children(":selected").text();
                                other_code_ids += idx + '_' +  $(this).val() + '-';
                            }
                        }
                    });
                    code_btn.val(select_code);
                    code_btn.attr("code_ids", `${base_code_ids}:${other_code_ids}`);
                    code_btn.parent().next().children().first().val($("#drw_no").attr("drw_no"));
                    code_btn.parent().next().children().first().attr("ref_id", $("#drw_no").attr("ref_id"));
                },
            },
            cancel: {
                action: function() {

                },
            }
        },
        columnClass: 'codes_modal',
        titleClass: 'codes_modal_title',
    });

    function set_lables(sel_el) {
        let group = "";
        let desc = "";
        let code = "";
        let idx = sel_el.attr("idx");
        let code_type = "other_codes";
        if (sel_el.hasClass("base_code")) {
            code_type = "base_codes";
            base_code_ids = ""
            $('.code_part').each(function() {
                let idx = $(this).attr("idx");
                if ($(this).hasClass("base_code")) {
                    base_code_ids += $(this).val() + '-';
                }
            });
            let drw_no = "None!";
            let ref_id = "";
            if (base_code_ids in code_references[class_id]['codes2ref']) {
                drw_no = code_references[class_id]['codes2ref'][base_code_ids]['man_page'];
                ref_id = code_references[class_id]['codes2ref'][base_code_ids]['ref_id'];
            }
            $("#drw_no").html(`Drawing No.: <b>${drw_no}</b>`);
            if (!ref_id) {
                drw_no = "";
            }
            $("#drw_no").attr("ref_id", ref_id);
            $("#drw_no").attr("drw_no", drw_no);
        }
        if (sel_el.val() != "") {
            group = code_references[class_id][code_type][idx][sel_el.val()]['group'];
            desc = code_references[class_id][code_type][idx][sel_el.val()]['desc'];
            code = code_references[class_id][code_type][idx][sel_el.val()]['code'];
            $(`label[for="${sel_el.attr("id")}"]`).html(`<u>${group}</u>: <b>${code}</b>  - ${desc}`);
        }
        else {
            $(`label[for="${sel_el.attr("id")}"]`).html("");
        }
    }

    function make_code_options_from_data() {
        let html_str = '<div style="display: flex; width: 100%; padding: 4px; justify-content: center; flex-wrap: wrap;">';
        html_str += "<div class='base_codes'>"
        let html_str2 = "<div style='width: 100%; padding: 4px; font-size: 14px; margin-top: 5px;'>";
        for (idx in code_references[class_id]['base_codes']) {
            html_str += `<select id="bcode-${idx}" class="code_part base_code" idx="${idx}">`;
            // prefix = code_references[class_id]['codes_at_indices'][idx]['prefix'];
            // group = code_references[class_id]['codes_at_indices'][idx]['group'];
            // desc = code_references[class_id]['codes_at_indices'][idx]['desc'];
            for (code in code_references[class_id]['base_codes'][idx]) {
                html_str += `<option value="${code}">${code_references[class_id]['base_codes'][idx][code]['code']}</option>`;
            }
            html_str += "</select>";
            html_str2 += `<label style="display: block;" for="bcode-${idx}"></label>`
        }
        html_str += '</div>';
        html_str += "<div class='other_codes'>"
        let curr_i = 1;
        let other_codes_length = Object.keys(code_references[class_id]['other_codes']).length;
        for (idx in code_references[class_id]['other_codes']) {
            html_str += `<select id="ocode-${idx}" class="code_part other_code" idx="${idx}">`;
            // prefix = code_references[class_id]['codes_at_indices'][idx]['prefix'];
            // group = code_references[class_id]['codes_at_indices'][idx]['group'];
            // desc = code_references[class_id]['codes_at_indices'][idx]['desc'];
            let first = true;
            for (code in code_references[class_id]['other_codes'][idx]) {
                if (curr_i === other_codes_length && first) {
                    html_str += `<option value=""></option>`;
                    first = false;
                }
                html_str += `<option value="${code}">${code_references[class_id]['other_codes'][idx][code]['code']}</option>`;
            }
            html_str += "</select>";
            html_str2 += `<label style="display: block;" for="ocode-${idx}"></label>`;
            curr_i++;
        }
        html_str += '</div>';
        html_str2 += '<p id="drw_no" ref_id="" drw_no="" style="display: block; text-align: center;">Drawing No.: </p></div></div>';
        html_str += html_str2;
        return html_str;
    }
}

$(".code").click(function(){
    load_man_pages($(this));
});

$(".cons_class").on('change', function() {
    validate_cons_class.call(this);
    clear_codes_ref($(this));
});

$("#save_copy").click(function(){
    $(this).parent().append("<input name='save_copy' value='1' type='hidden' />")
});

function validate_cons_class() {
    let curr_text = $(this).val();
    let valid = false;
    let class_id = "";
    $("#class_name-list option").each(function () {
        if (curr_text == $(this).val()) {
            valid = true;
            class_id = $(this).attr("class-id");
            return false;
        }
    });
    if (!valid) {
        this.setCustomValidity("Please select an option from the list!");
        $(this).prev().val(class_id);
    }
    else {
        this.setCustomValidity('');
        $(this).prev().val(class_id);
    }
}

function export_as_table() {
    let table_text = "<table id='export_table' border='2px' align='center'>";
    let table = document.getElementById("sched-table");
    let stn_no = "";
    let stn_label = "";
    let algn = "";
    let depth = "";
    let new_stn = false;
    for (let j = 0; j < table.rows.length; j++) {
        if (table.rows[j].cells.length == 11) {
            new_stn = true
        }
        if (j == 0) {
            table_text += "<tr>";
            for (let i = 0; i < table.rows[j].cells.length - 1; i++) {
                table_text += "<th>" + table.rows[j].cells[i].innerHTML + "</th>";
            }
            table_text += "</tr>";
        }
        else {
            if ($(table.rows[j].cells[0]).children().first().is("button")) {
                continue;
            }
            table_text += "<tr>";
            for (let i = 0; i < table.rows[j].cells.length; i++) {
                if ($(table.rows[j].cells[i]).children().first().is("button")) {
                    continue;
                }
                table_text += "<td>";
                let val = $(table.rows[j].cells[i]).children().first().val();
                if ($(table.rows[j].cells[i]).children().first().is("datalist")) {
                    val = $(table.rows[j].cells[i]).children().first().children(":selected").text();
                }
                switch (i) {
                    case 0:
                        if (new_stn) {
                            stn_no = val;
                            table_text += val;
                        }
                        else {
                            table_text += `${stn_no}</td><td>${stn_label}</td><td>${algn}</td><td>${depth}</td><td>${val}`;
                        }
                        
                        break;
                    case 1:
                        if (new_stn) stn_label = val;
                        table_text += val;
                        break;
                    case 2:
                        if (new_stn) algn = val;
                        table_text += val;
                        break;
                    case 3:
                        if (new_stn) {
                            depth = val;
                            new_stn = false;
                        }
                        table_text += val;
                        break;
                    default:
                        table_text += val;
                }
                table_text += "</td>";
            }
            table_text += "</tr>";
        }
    }
    table_text += "</table>";
    $("#templates").append(table_text);
    tableToExcel('export_table', 'Construction Schedule', 'Schedule.xls');
    $("#templates").remove("#export_table");
}

function export_csv() {
    let csv_text = "CONSTRUCTION SCHEDULE\r\n";
    let table = document.getElementById("sched-table");
    let stn_no = "";
    let stn_label = "";
    let algn = "";
    let depth = "";
    let new_stn = false;
    for (let j = 0; j < table.rows.length; j++) {
        if (table.rows[j].cells.length == 11) {
            new_stn = true
        }
        if (j == 0) {
            for (let i = 0; i < table.rows[j].cells.length - 1; i++) {
                csv_text += table.rows[j].cells[i].innerHTML + ",";
            }
            csv_text += "\r\n";
        }
        else {
            if ($(table.rows[j].cells[0]).children().first().is("button")) {
                continue;
            }
            for (let i = 0; i < table.rows[j].cells.length; i++) {
                if ($(table.rows[j].cells[i]).children().first().is("button")) {
                    continue;
                }
                let val = $(table.rows[j].cells[i]).children().first().val();
                if ($(table.rows[j].cells[i]).children().length == 2) {
                    val = $(table.rows[j].cells[i]).children().first().next().val();
                }
                switch (i) {
                    case 0:
                        if (new_stn) {
                            stn_no = val;
                            csv_text += val;
                        }
                        else {
                            // csv_text += `${stn_no},${stn_label},${algn},${depth},${val}`;
                            csv_text += `,,,,`;
                        }
                        
                        break;
                    case 1:
                        if (new_stn) stn_label = val;
                        csv_text += val;
                        break;
                    case 2:
                        if (new_stn) algn = val;
                        csv_text += val;
                        break;
                    case 3:
                        if (new_stn) {
                            depth = val;
                            new_stn = false;
                        }
                        csv_text += val;
                        break;
                    default:
                        csv_text += val;
                }
                csv_text += ",";
            }
            csv_text += "\r\n";
        }
    }
    // csv_text += "</table>";
    console.log(csv_text);
    if (window.navigator.msSaveOrOpenBlob) {
        let blob = new Blob([decodeURIComponent(encodeURI(csv_text))], {
            type: "text/csv;charset=utf-8;"
        });
        navigator.msSaveBlob(blob, "schedule.csv");
    } else {
        let link = document.createElement('a');
        link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv_text);
        link.target = '_blank';
        link.download = 'schedule.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

$("#export").click(function(e) {
    e.preventDefault();
    export_csv();
    // return window.open('data:application/vnd.ms-excel,' + encodeURIComponent(table_text));
})

function clear_codes_ref(class_el) {
    class_el.parent().next().children().first().val("");
    class_el.parent().next().children().first().removeAttr("code_ids");
    class_el.parent().next().next().children().first().val("");
    class_el.parent().next().next().children().first().attr("ref_id", "");
}

var tableToExcel = (function() {
    var uri = 'data:application/vnd.ms-excel;base64,'
      , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
      , base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) }
      , format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) }
    return function(table, name, fileName) {
      if (!table.nodeType) table = document.getElementById(table)
      var ctx = {worksheet: name || 'Worksheet', table: table.innerHTML}
      
      var link = document.createElement("A");
      link.href = uri + base64(format(template, ctx));
      link.download = fileName || 'Workbook.xls';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  })();

var tablesToExcel = (function() {
    var uri = 'data:application/vnd.ms-excel;base64,'
    , tmplWorkbookXML = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
      + '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>Axel Richter</Author><Created>{created}</Created></DocumentProperties>'
      + '<Styles>'
      + '<Style ss:ID="Currency"><NumberFormat ss:Format="Currency"></NumberFormat></Style>'
      + '<Style ss:ID="Date"><NumberFormat ss:Format="Medium Date"></NumberFormat></Style>'
      + '</Styles>' 
      + '{worksheets}</Workbook>'
    , tmplWorksheetXML = '<Worksheet ss:Name="{nameWS}"><Table>{rows}</Table></Worksheet>'
    , tmplCellXML = '<Cell{attributeStyleID}{attributeFormula}><Data ss:Type="{nameType}">{data}</Data></Cell>'
    , base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) }
    , format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) }
    return function(tables, wsnames, wbname, appname) {
      var ctx = "";
      var workbookXML = "";
      var worksheetsXML = "";
      var rowsXML = "";

      for (var i = 0; i < tables.length; i++) {
        if (!tables[i].nodeType) tables[i] = document.getElementById(tables[i]);
        for (var j = 0; j < tables[i].rows.length; j++) {
          rowsXML += '<Row>'
          for (var k = 0; k < tables[i].rows[j].cells.length; k++) {
            var dataType = tables[i].rows[j].cells[k].getAttribute("data-type");
            var dataStyle = tables[i].rows[j].cells[k].getAttribute("data-style");
            var dataValue = tables[i].rows[j].cells[k].getAttribute("data-value");
            dataValue = (dataValue)?dataValue:tables[i].rows[j].cells[k].innerHTML;
            var dataFormula = tables[i].rows[j].cells[k].getAttribute("data-formula");
            dataFormula = (dataFormula)?dataFormula:(appname=='Calc' && dataType=='DateTime')?dataValue:null;
            ctx = {  attributeStyleID: (dataStyle=='Currency' || dataStyle=='Date')?' ss:StyleID="'+dataStyle+'"':''
                   , nameType: (dataType=='Number' || dataType=='DateTime' || dataType=='Boolean' || dataType=='Error')?dataType:'String'
                   , data: (dataFormula)?'':dataValue
                   , attributeFormula: (dataFormula)?' ss:Formula="'+dataFormula+'"':''
                  };
            rowsXML += format(tmplCellXML, ctx);
          }
          rowsXML += '</Row>'
        }
        ctx = {rows: rowsXML, nameWS: wsnames[i] || 'Sheet' + i};
        worksheetsXML += format(tmplWorksheetXML, ctx);
        rowsXML = "";
      }

      ctx = {created: (new Date()).getTime(), worksheets: worksheetsXML};
      workbookXML = format(tmplWorkbookXML, ctx);



      var link = document.createElement("A");
      link.href = uri + base64(workbookXML);
      link.download = wbname || 'Workbook.xls';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  })();

