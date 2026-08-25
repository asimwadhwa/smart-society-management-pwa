from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# -------------------- CUSTOM USER --------------------
class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('OWNER', 'Owner'),
        ('TENANT', 'Tenant'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    phone_number = models.CharField(max_length=15)

    def __str__(self):
        return f"{self.username} ({self.role})"

# -------------------- SOCIETY --------------------
class Society(models.Model):
    name = models.CharField(max_length=150)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# -------------------- FLAT --------------------
class Flat(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name="flats")
    flat_number = models.CharField(max_length=10)

    owner = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'OWNER'},
        related_name="assigned_flat"
    )

    tenant = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'TENANT'},
        related_name="assigned_tenant_flat"
    )

    class Meta:
        unique_together = ('society', 'flat_number')

    def __str__(self):
        return f"{self.society.name} - {self.flat_number}"

# -------------------- MAINTENANCE BILL --------------------
class MaintenanceBill(models.Model):
    STATUS_CHOICES = (
        ('PAID', 'Paid'),
        ('UNPAID', 'Unpaid'),
    )
    flat = models.ForeignKey(Flat, on_delete=models.CASCADE, related_name="bills")
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='UNPAID')
    payment_date = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.status == 'PAID' and not self.payment_date:
            self.payment_date = timezone.now().date()
        super().save(*args, **kwargs)
    
    class Meta:
        unique_together = ('flat', 'month', 'year')


    def __str__(self):
        return f"{self.flat.flat_number} - {self.month}/{self.year}"