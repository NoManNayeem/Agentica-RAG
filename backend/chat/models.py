import os
import logging
from django.db import models
from django.conf import settings

# Optional: use Python's logging module for better debugging
logger = logging.getLogger(__name__)

from chat.utils.public_chat import public_vector_store
from chat.utils.private_chat import private_vector_store

class File(models.Model):
    PUBLIC = 'Public'
    PRIVATE = 'Private'
    INFO_TYPE_CHOICES = [
        (PUBLIC, 'Public'),
        (PRIVATE, 'Private'),
    ]

    filename = models.CharField(max_length=256)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='files'
    )
    status = models.CharField(max_length=20, default='Not Processed')
    information_type = models.CharField(
        max_length=20,
        choices=INFO_TYPE_CHOICES,
        default=PUBLIC
    )

    def __str__(self):
        return f'{self.filename} ({self.information_type})'

    def get_upload_path(self) -> str:
        """
        Construct the full path to the uploaded file.
        """
        return os.path.join(settings.BASE_DIR, 'uploads', self.filename)

    def delete_embeddings(self) -> bool:
        """
        Delete all embeddings associated with this file from the correct Chroma store.
        Returns True on success, False on failure.
        """
        try:
            store = (
                private_vector_store
                if self.information_type == self.PRIVATE
                else public_vector_store
            )
            col = store._collection
            results = col.get(where={"source": self.filename})
            vector_ids = results.get("ids", [])
            if vector_ids:
                store.delete(ids=vector_ids)
            return True
        except Exception as e:
            logger.exception(f"Error deleting embeddings for {self.filename}")
            return False

    def delete_from_filesystem(self) -> bool:
        """
        Delete the file from the filesystem.
        Returns True if file was deleted, False otherwise.
        """
        try:
            file_path = self.get_upload_path()
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            logger.exception(f"Error deleting file from filesystem: {self.filename}")
        return False

    def delete(self, *args, **kwargs):
        """
        Override delete to ensure embeddings and file are removed before DB deletion.
        """
        self.delete_embeddings()
        self.delete_from_filesystem()
        super().delete(*args, **kwargs)


class Conversation(models.Model):
    PUBLIC = 'Public'
    PRIVATE = 'Private'
    CONV_TYPE_CHOICES = [
        (PUBLIC, 'Public'),
        (PRIVATE, 'Private'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    conversation_type = models.CharField(
        max_length=20,
        choices=CONV_TYPE_CHOICES,
        default=PUBLIC
    )
    query = models.TextField()
    answer = models.TextField()
    sources = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f'Conversation {self.id} ({self.conversation_type})'
