from rest_framework import serializers
from .models import File, Conversation


class FileSerializer(serializers.ModelSerializer):
    information_type_display = serializers.CharField(
        source='get_information_type_display', read_only=True
    )

    class Meta:
        model = File
        fields = [
            'id',
            'filename',
            'uploaded_at',
            'status',
            'information_type',
            'information_type_display',
            'user'
        ]
        read_only_fields = [
            'id',
            'uploaded_at',
            'status',
            'user',
            'information_type_display'
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["user"] = request.user
        return super().create(validated_data)


class ConversationSerializer(serializers.ModelSerializer):
    conversation_type_display = serializers.CharField(
        source='get_conversation_type_display', read_only=True
    )

    class Meta:
        model = Conversation
        fields = [
            'id',
            'user',
            'conversation_type',
            'conversation_type_display',
            'query',
            'answer',
            'sources'
        ]
        read_only_fields = [
            'id',
            'user',
            'conversation_type',
            'conversation_type_display',
            'answer',
            'sources'
        ]
