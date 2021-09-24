from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class StationLabel(models.Model):
    label = models.CharField(verbose_name='Station Label', max_length=30)

class PoleAlignment(models.Model):
    name = models.CharField(verbose_name='Pole Alignment', max_length=30)

class Action(models.Model):
    name = models.CharField(verbose_name='Action', max_length=30)

class Station(models.Model):
    stn_num = models.IntegerField(verbose_name='Station Number')
    stn_label = models.CharField(verbose_name='Station Label', max_length=30)
    pole_alignment = models.CharField(max_length=50)
    pole_depth = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Pole Alignment Depth')

class Manual(models.Model):
    name = models.CharField(max_length=10)

class ConstructionClass(models.Model):
    name = models.CharField(verbose_name='Construction Class', max_length=30)
    # manual = models.ForeignKey(Manual, null=True, blank=True, on_delete=models.SET_NULL)

class ClassNames(models.Model):
    other_name = models.CharField(verbose_name="Construction Class Alternate names", max_length=30)
    construction_class = models.ForeignKey(ConstructionClass, on_delete=models.CASCADE)

class ConstructionClassCodeGroup(models.Model):
    construction_class = models.ForeignKey(ConstructionClass, on_delete=models.CASCADE)
    group_name = models.CharField(verbose_name='Code group name', max_length=30)
    index = models.IntegerField()
    prefix = models.CharField(max_length=1, verbose_name='Separator')
    is_base_code = models.BooleanField(default=False)

class Code(models.Model):
    code_group = models.ForeignKey(ConstructionClassCodeGroup, on_delete=models.CASCADE)
    desc = models.CharField(verbose_name='Description', max_length=60)
    code = models.CharField(max_length=10)
    
# class CodePart(models.Model):
#     index = models.IntegerField()
#     prefix = models.CharField(max_length=1, verbose_name='Separator')
    
# class Subcode(models.Model):
#     # code_part = models.ForeignKey(CodePart, on_delete=models.CASCADE)
#     code_option = models.ForeignKey(CodeOption, on_delete=models.CASCADE)

class ManualPage(models.Model):
    # construction_class = models.ForeignKey(ConstructionClass, null=True, on_delete=models.SET_NULL)
    # subcode = models.ForeignKey(Subcode, on_delete=models.CASCADE)
    num = models.CharField(max_length=10, verbose_name='Drawing Number')

class BaseConstructionSubcode(models.Model):
    code = models.ForeignKey(Code, on_delete=models.CASCADE)
    manual_page = models.ForeignKey(ManualPage, on_delete=models.CASCADE)

class ConstructionScheduleStore(models.Model):
    name = models.CharField(max_length=20)
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    date_created = models.DateField(default=timezone.now)
    date_modified = models.DateField(default=timezone.now)

class ConstructionSchedule(models.Model):
    store = models.ForeignKey(ConstructionScheduleStore, null=True, blank=True, on_delete=models.SET_NULL)
    station = models.ForeignKey(Station, null=True, on_delete=models.SET_NULL)
    action = models.ForeignKey(Action, null=True, on_delete=models.SET_NULL)
    construction_class = models.ForeignKey(ConstructionClass, null=True, on_delete=models.SET_NULL)
    man_page = models.ForeignKey(ManualPage, null=True, on_delete=models.SET_NULL)
    position = models.IntegerField(verbose_name='Position on Pole')
    remarks = models.CharField(max_length=100)

class ConstructionScheduleSubcode(models.Model):
    schedule = models.ForeignKey(ConstructionSchedule, on_delete=models.CASCADE)
    code = models.ForeignKey(Code, on_delete=models.CASCADE)

