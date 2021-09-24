from django.shortcuts import render, redirect, reverse
from urllib.parse import urlencode
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
from django.db import transaction

from django.contrib.auth.models import User
from .models import (Station, StationLabel, PoleAlignment, Action, ConstructionClass,
                    ClassNames, ConstructionClassCodeGroup, Code, ManualPage,
                    BaseConstructionSubcode, ConstructionSchedule, ConstructionScheduleSubcode)

@login_required(login_url='/admin/login')
def index(request):
    context = {}
    context['user'] = request.user
    context['users'] = User.objects.filter(is_staff=True)
    context['has_permission'] = request.user.is_active and request.user.is_staff
    context['is_admin'] = False
    context['cons_classes'] = []
    all_classes = ConstructionClass.objects.all()
    for cc in all_classes:
        other_names = ClassNames.objects.filter(construction_class__id=cc.id)
        o_names = []
        for name in other_names:
            o_names.append(name.other_name)
        context['cons_classes'].append({'id': cc.id, 'name':cc.name, 'other_names': o_names})
    if request.user.is_superuser:
        context['is_admin'] = True
    return render(request, 'componentmanualcode/index.html', context)

@login_required(login_url='/admin/login')
def admin_index(request):
    if not request.user.is_superuser:
        return redirect('main:index')
    context = {}
    context['user'] = request.user
    context['has_permission'] = request.user.is_active and request.user.is_staff
    context['is_admin'] = False
    if request.user.is_superuser:
        context['is_admin'] = True
        context['existing_classes'] = []
        all_classes = ConstructionClass.objects.all()
        for cc in all_classes:
            context['existing_classes'].append({'id': cc.id, 'name':cc.name})
        class_id = request.GET.get('class_id')
        class_dict = {}
        if class_id:
            cons_class = ConstructionClass.objects.get(id=class_id)
            class_dict['name'] = cons_class.name
            class_dict['id'] = cons_class.id
            class_dict['alt_names'] = ClassNames.objects.filter(construction_class__id=class_id)
            base_code_groups = ConstructionClassCodeGroup.objects.filter(construction_class__id=class_id, is_base_code=True).order_by('index')
            class_dict['base_code_groups'] = []
            for group in base_code_groups:
                group_codes = Code.objects.filter(code_group__id=group.id)
                codes = []
                for code in group_codes:
                    codes.append({'id': code.id, 'code': code.code, 'desc': code.desc})
                class_dict['base_code_groups'].append({'id':group.id, 'name': group.group_name,
                                                        'index': group.index, 'prefix': group.prefix,
                                                        'codes': codes })
            
            other_code_groups = ConstructionClassCodeGroup.objects.filter(construction_class__id=class_id, is_base_code=False).order_by('index')
            class_dict['other_code_groups'] = []
            for group in other_code_groups:
                group_codes = Code.objects.filter(code_group__id=group.id)
                codes = []
                for code in group_codes:
                    codes.append({'id': code.id, 'code': code.code, 'desc': code.desc})
                class_dict['other_code_groups'].append({'id':group.id, 'name': group.group_name,
                                                        'index': group.index, 'prefix': group.prefix,
                                                        'codes': codes })
            context['cons_class'] = class_dict
    return render(request, 'componentmanualcode/admin_index.html', context)

def load_base_code_references(request):
    class_id = request.GET.get('class-id')
    if class_id:
        base_code_groups = ConstructionClassCodeGroup.objects.filter(construction_class__id=class_id, is_base_code=True).order_by('index')
        references = {}
        for group in base_code_groups:
            group_codes = Code.objects.filter(code_group__id=group.id)
            for code in group_codes:
                base_subcode = BaseConstructionSubcode.objects.filter(code__id=code.id)
                for subcode in base_subcode:
                    if subcode.manual_page.id not in references:
                        references[subcode.manual_page.id] = {'page': subcode.manual_page.num, 'subcode': [] }
                    references[subcode.manual_page.id]['subcode'].append(subcode.code.id)
        return JsonResponse(references)
    
def save_codes(request):
    if request.POST:
        with transaction.atomic():
            class_id = request.POST['cons_class-id']
            cons_class = None
            if class_id:
                cons_class = ConstructionClass.objects.get(id=class_id)
                if 'cons_class-delete' in request.POST:
                    cons_class.delete()
                    return redirect(reverse('main:admin_index'))
                cons_class.name = request.POST['cons_class-name']
                cons_class.save()
            else:
                cons_class = ConstructionClass(name=request.POST['cons_class-name'])
                cons_class.save()
            data = {}
            for k, v in request.POST.items():
                k_parts = k.split('-')
                if len(k_parts) < 3:
                    continue
                if k_parts[0] not in data:
                    data[k_parts[0]] = {}
                if k_parts[2] not in data[k_parts[0]]:
                    data[k_parts[0]][k_parts[2]] = {}
                if k_parts[0] == 'new_ref_code' or k_parts[0] == 'ref_code':
                    if k_parts[1] == 'code':
                        if 'code' not in data[k_parts[0]][k_parts[2]]:
                            data[k_parts[0]][k_parts[2]][k_parts[1]] = []
                        if v != '------':
                            data[k_parts[0]][k_parts[2]][k_parts[1]].append(v)
                    else:
                        data[k_parts[0]][k_parts[2]][k_parts[1]] = v
                else:
                    data[k_parts[0]][k_parts[2]][k_parts[1]] = v
            if 'new_class_name' in data:
                for k, new_alt_name in data['new_class_name'].items():
                    if new_alt_name['name']:
                        new_class_name = ClassNames(other_name=new_alt_name['name'],
                                                construction_class=cons_class)
                        new_class_name.save()
            if 'class_name' in data:
                for n_id, alt_name in data['class_name'].items():
                    class_name = ClassNames.objects.get(id=n_id)
                    if alt_name['name'] == "":
                        class_name.delete()
                        continue
                    class_name.other_name = alt_name['name']
                    class_name.save()
            if 'bnew_group' in data:
                for k, new_group_data in data['bnew_group'].items():
                    new_group = ConstructionClassCodeGroup(construction_class=cons_class,
                                            group_name=new_group_data['name'],
                                            index=new_group_data['index'], prefix=new_group_data['prefix'],
                                            is_base_code=True)
                    new_group.save()
                    data['bnew_group'][k]["id"] = new_group.id
            if 'new_group' in data:
                for k, new_group_data in data['new_group'].items():
                    new_group = ConstructionClassCodeGroup(construction_class=cons_class,
                                                        group_name=new_group_data['name'],
                                                        index=new_group_data['index'], prefix=new_group_data['prefix'],
                                                        is_base_code=False)
                    new_group.save()
                    data['new_group'][k]["id"] = new_group.id
            if 'new_code' in data:
                for k, new_code_data in data["new_code"].items():
                    if new_code_data['code'] != "":
                        group =  new_code_data['group'].split('-')
                        group_id = group[1]
                        if group[0] == 'new_group' or group[0] == 'bnew_group':
                            group_id = data[group[0]][group[1]]['id']
                        new_code = Code(code_group_id=group_id,
                                        code=new_code_data['code'], desc=new_code_data['desc'])
                        new_code.save()
                        data["new_code"][k]['id'] = new_code.id
            if 'new_ref_code' in data:
                for k, new_ref_data in data['new_ref_code'].items():
                    if 'code' in new_ref_data:
                        man_page = ManualPage(num=new_ref_data['ref'])
                        man_page.save()
                        for code in new_ref_data['code']:
                            code_split = code.split('-')
                            code_id = code_split[2]
                            if code_split[0] == 'new_code':
                                code_id = data[code_split[0]][code_split[2]]['id']
                                
                            bc_subcode = BaseConstructionSubcode(code_id= code_id,
                                                                 manual_page=man_page)
                            bc_subcode.save()
            if 'bgroup' in data:
                for g_id, group_data  in data['bgroup'].items():
                    group = ConstructionClassCodeGroup.objects.get(id=g_id)
                    if 'delete' in group_data:
                        group.delete()
                        continue
                    group.group_name = group_data['name']
                    group.index = group_data['index']
                    group.prefix = group_data['prefix']
                    group.save()
            if 'group' in data:
                for g_id, group_data in data['group'].items():
                        group = ConstructionClassCodeGroup.objects.get(id=g_id)
                        if 'delete' in group_data:
                            group.delete()
                            continue
                        group.group_name = group_data['name']
                        group.index = group_data['index']
                        group.prefix = group_data['prefix']
                        group.save()
            if 'code' in data:
                for c_id, code_data in data['code'].items():
                    code = Code.objects.get(id=c_id)
                    if 'delete' in code_data:
                        code.delete()
                        continue
                    code.code = code_data['code']
                    code.desc = code_data['desc']
                    code.save()
            if 'ref_code' in data:
                for r_id, ref_data in data['ref_code'].items():
                    man_page = ManualPage.objects.get(id=r_id)
                    if 'delete' in ref_data:
                        man_page.delete()
                        continue
                    bc_subcodes = BaseConstructionSubcode.objects.filter(manual_page__id=r_id)
                    if 'code' in ref_data and len(ref_data['code']) == len(bc_subcodes):
                        for subcode in bc_subcodes:
                            for new_code in ref_data['code']:
                                code_split = new_code.split('-')
                                _code = None
                                if code_split[0] == 'new_code':
                                    _code = Code.objects.get(id=data[code_split[0]][code_split[2]]["id"])
                                else:
                                    _code = Code.objects.get(id=code_split[2])
                                if subcode.code.code_group.index == _code.code_group.index:
                                    subcode.code = _code
                                    subcode.manual_page.num = ref_data['ref']
                                    subcode.manual_page.save()
                                    subcode.save()
                    else:
                        man_page.delete()
            base_url = reverse('main:admin_index')
            query_string =  urlencode({'class_id': cons_class.id})
            url = '{}?{}'.format(base_url, query_string)
            return redirect(url)

def load_man_page_codes(request):
    class_id = request.GET.get('class-id')
    if class_id:
        code_refs = BaseConstructionSubcode.objects.filter(code__code_group__construction_class__id=class_id)
        class_codes = Code.objects.filter(code_group__construction_class__id=class_id)
        data = {'base_codes': {}, 'other_codes': {}}
        for code in class_codes:
            if code.code_group.is_base_code:
                index = code.code_group.index
                if index not in data['base_codes']:
                    data['base_codes'][index] = {}
                data['base_codes'][index][code.id] = {'code': code.code,
                                                      'desc': code.desc,
                                                      'group': code.code_group.group_name,
                                                      'prefix': code.code_group.prefix}
            else:
                index = code.code_group.index
                if index not in data['other_codes']:
                    data['other_codes'][index] = {}
                data['other_codes'][index][code.id] = {'code': code.code,
                                                       'desc': code.desc,
                                                       'group': code.code_group.group_name,
                                                       'prefix': code.code_group.prefix}
        ref_dict = {}
        for ref in code_refs:
            if ref.manual_page.id not in ref_dict:
                ref_dict[ref.manual_page.id] = {'page': ref.manual_page.num, 'codes':{}}
            index = ref.code.code_group.index
            # if index not in ref_dict[ref.manual_page.id]['codes']:
            #     ref_dict[ref.manual_page.id]['codes'][index] = []
            ref_dict[ref.manual_page.id]['codes'][index] = {'id':ref.code.id, 'code': ref.code.code,
                                                                 'desc': ref.code.desc,
                                                                 'group': ref.code.code_group.group_name,
                                                                 'prefix': ref.code.code_group.prefix}
        data['ref_dict'] = ref_dict
        return JsonResponse(data)

def save_schedules(request):
    return redirect(reverse('main:index'))
