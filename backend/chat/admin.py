# chat/admin.py

from django.contrib import admin
from .models import File, Conversation


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('id', 'filename', 'user', 'information_type', 'status', 'uploaded_at')
    list_filter = ('information_type', 'status', 'uploaded_at')
    search_fields = ('filename', 'user__username')
    ordering = ('-uploaded_at',)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'conversation_type', 'query', 'answer')
    list_filter = ('conversation_type',)
    search_fields = ('query', 'answer', 'user__username')
    ordering = ('-id',)
