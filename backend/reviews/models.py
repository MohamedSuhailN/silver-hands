from decimal import Decimal
from django.conf import settings
from django.db import models
from django.db.models import Avg
from bookings.models import Booking
from marketplace.models import ProviderProfile, Service

class Review(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_reviews')
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='reviews')
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    booking = models.OneToOneField(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='review')
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}★ by {self.customer.username} for {self.provider.display_name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_ratings()

    def _update_ratings(self):
        # Update provider average rating
        agg_p = Review.objects.filter(provider=self.provider).aggregate(avg=Avg('rating'))
        avg_p = agg_p['avg'] or 5.0
        count_p = Review.objects.filter(provider=self.provider).count()
        ProviderProfile.objects.filter(pk=self.provider_id).update(
            rating=Decimal(str(round(avg_p, 2))),
            review_count=count_p
        )

        # Update service average rating
        if self.service:
            agg_s = Review.objects.filter(service=self.service).aggregate(avg=Avg('rating'))
            avg_s = agg_s['avg'] or 5.0
            count_s = Review.objects.filter(service=self.service).count()
            Service.objects.filter(pk=self.service_id).update(
                rating=Decimal(str(round(avg_s, 2))),
                review_count=count_s
            )
