from django.urls import path
from .views import ReviewListCreateView, ProviderReviewsView, ProviderReviewIntelligenceView

urlpatterns = [
    path('reviews/intelligence/', ProviderReviewIntelligenceView.as_view(), name='review-intelligence'),
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('providers/<int:provider_id>/reviews/', ProviderReviewsView.as_view(), name='provider-reviews'),
]
