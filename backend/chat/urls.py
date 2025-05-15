from django.urls import path
from .views import (
    FileUploadView,
    FileDeleteView,
    FileProcessView,
    PublicChatView,
    PrivateChatView,
    PrivateChatHistoryView
)

app_name = "chat"

urlpatterns = [
    # File endpoints
    path("files/", FileUploadView.as_view(), name="upload"),
    path("files/<int:pk>/", FileDeleteView.as_view(), name="delete"),
    path("files/<int:pk>/process/", FileProcessView.as_view(), name="process"),

    # Chat endpoints
    path("chat/public/", PublicChatView.as_view(), name="public"),
    path("chat/private/", PrivateChatView.as_view(), name="private"),

    # Chat history
    path("chat/private/history/", PrivateChatHistoryView.as_view(), name="private-history"),

]
