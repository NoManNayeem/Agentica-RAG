import os
import logging
from django.conf import settings
from chat.models import File

from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# Embedding model
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")

# Vector DB paths
PRIVATE_DB_PATH = os.path.join(settings.BASE_DIR, "private_chroma_db")
PUBLIC_DB_PATH = os.path.join(settings.BASE_DIR, "public_chroma_db")

# Chroma vector stores
private_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory=PRIVATE_DB_PATH,
)

public_store = Chroma(
    collection_name="example_collection",
    embedding_function=embeddings,
    persist_directory=PUBLIC_DB_PATH,
)

# Text splitter config
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
)


def process_file(file_record: File, upload_folder: str) -> str:
    """
    Process one uploaded file:
    - Choose the correct Chroma store based on `information_type`
    - Remove existing embeddings
    - Load and tag the document
    - Split it into chunks
    - Upsert into Chroma
    """
    try:
        store = private_store if file_record.information_type == File.PRIVATE else public_store
        file_path = os.path.join(upload_folder, file_record.filename)

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at {file_path}")

        # Step 1: Delete any existing vectors
        store.delete(where={"source": file_record.filename})

        # Step 2: Load the document
        ext = os.path.splitext(file_record.filename)[1].lower()
        if ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif ext == ".docx":
            loader = Docx2txtLoader(file_path)
        elif ext == ".txt":
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            return "Unsupported Format"

        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = file_record.filename

        # Step 3: Chunk + Upsert
        chunks = splitter.split_documents(docs)
        store.add_documents(chunks)

        return "Processed"
    
    except Exception as e:
        logger.exception(f"Error processing file {file_record.filename}")
        return "Error"
