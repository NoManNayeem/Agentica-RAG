import os
from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import File, Conversation
from .serializers import FileSerializer, ConversationSerializer
from .utils.process_file import process_file
from .utils.public_chat import public_ask
from .utils.private_chat import ask as private_ask

# Ensure uploads folder exists
UPLOAD_DIR = os.path.join(settings.BASE_DIR, 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_files = File.objects.filter(user=request.user).order_by("-uploaded_at")
        serializer = FileSerializer(user_files, many=True)
        return Response(serializer.data)

    def post(self, request):
        file_obj = request.FILES.get("file")
        info_type = request.data.get("information_type", "Public")

        if not file_obj:
            return Response({"error": "No file uploaded."}, status=400)

        file_record = File.objects.create(
            filename=file_obj.name,
            user=request.user,
            information_type=info_type
        )

        # Save to disk
        import os
        from django.conf import settings

        upload_path = os.path.join(settings.BASE_DIR, "uploads")
        os.makedirs(upload_path, exist_ok=True)

        full_path = os.path.join(upload_path, file_obj.name)
        with open(full_path, "wb+") as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        serializer = FileSerializer(file_record)
        return Response(serializer.data, status=201)

class FileDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        file = get_object_or_404(File, pk=pk)
        if file.user != request.user:
            return Response({'error': 'Permission denied.'}, status=403)
        file.delete()
        return Response({'message': 'File deleted successfully.'}, status=204)


class FileProcessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        file = get_object_or_404(File, pk=pk)
        if file.user != request.user:
            return Response({'error': 'Permission denied.'}, status=403)

        try:
            new_status = process_file(file, UPLOAD_DIR)
            file.status = new_status
            file.save()
            return Response({'message': 'File processed successfully.', 'status': new_status}, status=200)
        except Exception as e:
            file.status = 'Error'
            file.save()
            return Response({'error': f'Processing failed: {str(e)}'}, status=500)


class PublicChatView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required.'}, status=400)

        output = public_ask(message)
        reply = output.get('result')
        source_docs = output.get('source_documents', [])

        sources = [
            {
                'source': doc.metadata.get('source'),
                'content': doc.page_content[:200]
            }
            for doc in source_docs
        ]

        Conversation.objects.create(
            user=None,
            conversation_type=Conversation.PUBLIC,
            query=message,
            answer=reply,
            sources=sources
        )

        return Response({'reply': reply})


class PrivateChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({'error': 'Message is required.'}, status=400)

        output = private_ask(message)
        reply = output.get('result')
        source_docs = output.get('source_documents', [])

        sources = [
            {
                'source': doc.metadata.get('source'),
                'content': doc.page_content[:200]
            }
            for doc in source_docs
        ]

        # Save conversation
        Conversation.objects.create(
            user=request.user,
            conversation_type=Conversation.PRIVATE,
            query=message,
            answer=reply,
            sources=sources
        )

        recent_history = (
            Conversation.objects
            .filter(user=request.user, conversation_type=Conversation.PRIVATE)
            .order_by('-id')[:4]
        )
        serialized = ConversationSerializer(recent_history, many=True)
        return Response({
            'reply': reply,
            'sources': sources,
            'history': serialized.data[::-1]  # Oldest first
        })



# chat/views.py
class PrivateChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        conversations = (
            Conversation.objects
            .filter(user=request.user, conversation_type="Private")
            .order_by("-id")[:10]
        )
        # Reverse in Python before serializing
        conversations = list(conversations)[::-1]
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data)

