from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Review
from .serializers import ReviewSerializer
from marketplace.models import ProviderProfile, Service

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.all()
        provider_id = self.request.query_params.get('provider')
        service_id = self.request.query_params.get('service')
        if provider_id:
            qs = qs.filter(provider_id=provider_id)
        if service_id:
            qs = qs.filter(service_id=service_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

class ProviderReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        provider_id = self.kwargs.get('provider_id')
        return Review.objects.filter(provider_id=provider_id)
