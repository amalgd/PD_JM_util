from django.urls import path

from .views import (admin_index, index, save_codes,
                    load_base_code_references, save_schedules,
                    load_man_page_codes)

urlpatterns = [
    path('', index, name='index'),
    path('manage/', admin_index, name='admin_index'),
    path('manage/<int:class_id>/', admin_index, name='admin_edit'),
    path('save-codes/', save_codes, name='save_codes'),
    path('save-schedules/', save_schedules, name='save_scheds'),
    path('ajax/load-base-code-references/', load_base_code_references, name='ajax_load_base_code_references'),
    path('ajax/load-man-page-codes/', load_man_page_codes, name='ajax_load_man_page_codes'),
]