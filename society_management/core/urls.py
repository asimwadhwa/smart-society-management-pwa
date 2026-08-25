from django.urls import path
from .views import*

urlpatterns = [
    path('', login_view, name='login'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),

    path('admin-dashboard/', admin_dashboard, name='admin_dashboard'),
    path('owner-dashboard/', owner_dashboard, name='owner_dashboard'),
    path('tenant-dashboard/', tenant_dashboard, name='tenant_dashboard'),
    
    path('toggle-owner/<int:user_id>/', toggle_owner_status, name='toggle_owner_status'),
    path('edit-owner/<int:user_id>/', edit_owner, name='edit_owner'),
    path('mark-paid/<int:bill_id>/', mark_bill_paid, name='mark_bill_paid'),



    path('create-owner/', create_owner, name='create_owner'),
    path('create-society/', create_society, name='create_society'),
    path('create-flat/', create_flat, name='create_flat'),
    path('create-bill/', create_bill, name='create_bill'),

]
