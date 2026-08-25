from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib import messages
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.core.mail import send_mail
from .models import Society, Flat, MaintenanceBill

User = get_user_model()

# --- AUTH ---
def login_view(request):
    if request.method == 'POST':
        u = request.POST.get('username')
        p = request.POST.get('password')
        user = authenticate(request, username=u, password=p)
        if user is not None:
            if user.is_active:
                login(request, user)
                if user.role == 'ADMIN': return redirect('admin_dashboard')
                elif user.role == 'OWNER': return redirect('owner_dashboard')
                return redirect('tenant_dashboard')
            messages.error(request, "Account inactive.")
        else:
            messages.error(request, "Invalid credentials.")
    return render(request, 'login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

# --- DASHBOARDS ---

@login_required
def admin_dashboard(request):
    if request.user.role != 'ADMIN':
        return HttpResponse("Unauthorized", status=403)

    owners = User.objects.filter(role='OWNER')
    return render(request, 'admin_dashboard.html', {'owners': owners})


@login_required
def owner_dashboard(request):
    if request.user.role != 'OWNER': 
        return HttpResponse("Unauthorized", status=403)
    flat = Flat.objects.select_related('society').filter(owner=request.user).first()
    bills = flat.bills.all().order_by('-year') if flat else []
    return render(request, 'owner_dashboard.html', {'flat': flat, 'bills': bills})

@login_required
def tenant_dashboard(request):
    if request.user.role != 'TENANT':
        return HttpResponse("Unauthorized", status=403)

    flat = Flat.objects.select_related('society').filter(tenant=request.user).first()
    bills = flat.bills.all().order_by('-year') if flat else []

    return render(request, 'tenant_dashboard.html', {
        'flat': flat,
        'bills': bills
    })

# --- ADMIN ACTIONS ---
@login_required
def create_owner(request):
    if request.user.role != 'ADMIN': 
        return HttpResponse("Unauthorized", status=403)
    
    if request.method == "POST":
        u = request.POST.get('username')
        e = request.POST.get('email')
        ph = request.POST.get('phone_number') 
        p = request.POST.get('password') 
        
        if User.objects.filter(username=u).exists():
            messages.error(request, "Username already exists.")
            return redirect('create_owner')

        # Create user and assign custom fields
        user = User.objects.create_user(username=u, email=e, password=p)
        user.role = 'OWNER'
        user.phone_number = ph 
        user.save()

        # Step 4 Requirement: Send login credentials via email
        send_mail(
            subject="Your Society Management Account",
            message=f"Username: {u}\nPassword: {p}",
            from_email="admin@society.com",
            recipient_list=[e],
            fail_silently=False,
        )

        messages.success(request, f"Owner {u} created and credentials sent to {e}.")
        return redirect('admin_dashboard')
    
    return render(request, 'create_owner.html') 

@login_required
def create_society(request):
    if request.user.role != 'ADMIN': return HttpResponse("Unauthorized", status=403)
    if request.method == "POST":
        n = request.POST.get('name')
        a = request.POST.get('address')
        Society.objects.create(name=n, address=a)
        messages.success(request, "Society created.")
        return redirect('admin_dashboard')
    return render(request, 'create_society.html')

@login_required
def create_flat(request):
    if request.user.role != 'ADMIN':
        return HttpResponse("Unauthorized", status=403)

    if request.method == "POST":
        s_id = request.POST.get('society')
        f_num = request.POST.get('flat_number')
        o_id = request.POST.get('owner')
        t_id = request.POST.get('tenant')

        Flat.objects.create(
            society_id=s_id,
            flat_number=f_num,
            owner_id=o_id if o_id else None,
            tenant_id=t_id if t_id else None
        )

        messages.success(request, "Flat created.")
        return redirect('admin_dashboard')

    return render(request, 'create_flat.html', {
        'societies': Society.objects.all(),
        'owners': User.objects.filter(role='OWNER'),
        'tenants': User.objects.filter(role='TENANT')
    })

@login_required
def create_bill(request):
    if request.user.role != 'ADMIN':
        return HttpResponse("Unauthorized", status=403)

    flats = Flat.objects.all()

    if request.method == "POST":
        flat_id = request.POST.get('flat')
        month = request.POST.get('month')
        year = request.POST.get('year')
        amount = request.POST.get('amount')
        due_date = request.POST.get('due_date')

        flat = Flat.objects.get(id=flat_id)

    
        if MaintenanceBill.objects.filter(
                flat=flat,
                month=month,
                year=year
        ).exists():
            messages.error(request, "Maintenance bill already exists for this flat and month.")
            return redirect('create_bill')

        MaintenanceBill.objects.create(
            flat=flat,
            month=month,
            year=year,
            amount=amount,
            due_date=due_date
        )

        messages.success(request, "Bill created successfully.")
        return redirect('admin_dashboard')

    return render(request, 'create_bill.html', {'flats': flats})


@login_required
def toggle_owner_status(request, user_id):
    if request.user.role != 'ADMIN':
        return HttpResponse("Unauthorized", status=403)

    try:
        owner = User.objects.get(id=user_id, role='OWNER')
        owner.is_active = not owner.is_active
        owner.save()

        status = "Activated" if owner.is_active else "Deactivated"
        messages.success(request, f"Owner {owner.username} {status} successfully.")

    except User.DoesNotExist:
        messages.error(request, "Owner not found.")

    return redirect('admin_dashboard')

@login_required
def edit_owner(request, user_id):
    if request.user.role != 'ADMIN':
        return HttpResponse("Unauthorized", status=403)

    owner = User.objects.get(id=user_id, role='OWNER')

    if request.method == "POST":
        owner.username = request.POST.get('username')
        owner.email = request.POST.get('email')
        owner.phone_number = request.POST.get('phone_number')
        owner.save()

        messages.success(request, "Owner updated successfully.")
        return redirect('admin_dashboard')

    return render(request, 'edit_owner.html', {'owner': owner})

@login_required
def mark_bill_paid(request, bill_id):
    if request.method != "POST":
        return HttpResponse("Invalid request", status=400)

    bill = MaintenanceBill.objects.get(id=bill_id)

    # Security check: only owner of that flat can mark paid
    if bill.flat.owner != request.user:
        return HttpResponse("Unauthorized", status=403)

    bill.status = 'PAID'
    bill.save()   # payment_date auto-set in model

    messages.success(request, "Bill marked as Paid.")
    return redirect('owner_dashboard')


