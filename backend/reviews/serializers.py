from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    provider_name = serializers.CharField(source='provider.display_name', read_only=True)
    service_title = serializers.CharField(source='service.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'customer', 'customer_name', 'customer_username', 'provider',
            'provider_name', 'service', 'service_title', 'booking', 'rating',
            'comment', 'created_at'
        ]
        read_only_fields = ['id', 'customer', 'created_at']
