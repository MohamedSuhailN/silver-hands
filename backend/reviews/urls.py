from django.urls import path
from .views import ReviewListCreateView, ProviderReviewsView

urlpatterns = [
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('providers/<int:provider_id>/reviews/', ProviderReviewsView.as_view(), name='provider-reviews'),
]
