from django.contrib import admin

from .models import (ConstructionSchedule, ConstructionClass, 
                     ConstructionClassCodeGroup, Code,
                     BaseConstructionSubcode, ManualPage,
                     ConstructionScheduleSubcode)


admin.site.site_header = 'Pole Design Job Management Utilities'
admin.site.site_title = 'Pole Design JM Utils'
admin.site.register({ConstructionSchedule, ConstructionClass})