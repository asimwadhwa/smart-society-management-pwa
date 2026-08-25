from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Society, Flat, MaintenanceBill

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role', 'phone_number')}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(Society)
admin.site.register(Flat)
admin.site.register(MaintenanceBill)
